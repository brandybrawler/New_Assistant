'use client'
import React, { useState, useRef , useEffect} from "react";
import {
  FiPhoneCall,
  FiMic,
  FiPhoneOff,
  FiMoon,
  FiSun,
  FiStar,
} from "react-icons/fi";
import { IoClose } from "react-icons/io5";



const Page = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [callOngoing, setCallOngoing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [starRating, setStarRating] = useState(0); // State to track star rating
  const [feedbackText, setFeedbackText] = useState(""); // State to track feedback input text
  const [feedbackCategory, setFeedbackCategory] = useState(""); // State to track feedback category
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const callTimerRef = useRef(null);
  const [userDetails, setUserDetails] = useState(""); // State to track feedback input text
  const [tenantDetails, setTenantDetails] = useState(""); // State to track feedback input text
  const [callId, setCallId] = useState(null); // State to hold the call_id

  ///NEW ASSISTANT LOGIC
  ///NEW ASSISTANT LOGIC
  ///NEW ASSISTANT LOGIC

  const [chatLog, setChatLog] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [status, setStatus] = useState("Not Connected");
  const [errorMessage, setErrorMessage] = useState("");

  ///NEW ASSISTANT LOGIC
  ///NEW ASSISTANT LOGIC
  ///NEW ASSISTANT LOGIC

  let urlParams
  if(typeof window !== 'undefined') urlParams = new URLSearchParams(window.location.search);
  const authTokenUser = urlParams?.get("user_uri");
  const authTokenTenant = urlParams?.get("auth_uri");

  useEffect(() => {
    // Function to fetch community details
    const getCommunityDetails = async () => {
      try {
        const apiUrl = `https://core.proximaai.co/api/tenantmanagement/tenantdetails/?token=${authTokenTenant}`;

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setTenantDetails(data);
      } catch (error) {
        console.error("Error fetching community details:", error);
        // alert("Error retrieving community details. Please try again later.");
      }
    };

    // Function to fetch user details
    const getUserDetails = async () => {
      try {
        let urlParams
        if(typeof window !== 'undefined') urlParams = new URLSearchParams(window.location.search);
        const authTokenUser = urlParams?.get("user_uri");
        const apiUrl = `https://core.proximaai.co/api/auth/decodeusertoken/?token=${authTokenUser}`;

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setUserDetails(data);
      } catch (error) {
        console.error("Error fetching user details:", error);
        // alert("Error retrieving user details. Please try again later.");
      }
    };

    // Execute both fetch functions on component mount
    getCommunityDetails();
    getUserDetails();

    // Clean up functions (optional)
    return () => {
      // Perform cleanup if needed
    };
  }, []); // Empty dependency array means this effect runs only once after initial render

  // fisrt endpoint
  const handleEndCall = () => {
    // Construct the request body
    const requestBody = {
      duration: callDuration * 1000, // Replace with actual duration value (e.g., obtained from a timer or calculation)
      tenant_id: 1,
      success: true, // Replace with actual success value (e.g., obtained from call status)
      client_caller: 1,
    };

    // Token for authorization

    // Make POST request using fetch API
    fetch("https://core.proximaai.co/api/call/call/calls/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${authTokenUser}`,
      },
      body: JSON.stringify(requestBody),
    })
      .then((response) => {
        if (response.ok) {
          return response.json(); // Parse response JSON
        } else {
          throw new Error(`HTTP error! Status: ${response.status}`); // Throw error for non-200 status codes
        }
      })
      .then((data) => {
        console.log("POST request succeeded with JSON response:", data);
        setCallId(data.call_id);
        // Handle successful response here (e.g., display success message to user)
        // alert("Call ended successfully!");
      })
      .catch((error) => {
        console.error("Error making POST request:", error);
        // Handle error (e.g., display error message to user)
        // alert("Error ending call. Please try again later.");
      });
  };

  // second endpoint

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const startCall = () => {
    // initiliaze websocket start websocket connection
    handleStartVoiceInput();

    console.log("call started");
    setCallOngoing(true);

    // Start the call timer
    callTimerRef.current = setInterval(() => {
      setCallDuration((prevDuration) => prevDuration + 1);
    }, 1000);
  };

  const mute = () => {
    console.log("call muted");
  };

  const endCall = () => {
    handleStopVoiceInput();
    // function to post call duration to backend
    handleEndCall();

    // function to post call duration to backend

    console.log("call ended");
    console.log("Call duration:", formatDuration(callDuration)); // Log the call duration
    setCallOngoing(false);

    // Stop the call timer
    clearInterval(callTimerRef.current);
    setCallDuration(0);

    // Show the rating modal after 2 seconds
    setTimeout(() => {
      setShowRatingModal(true);
    }, 2000); // Show modal after 2 seconds
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const closeModal = () => {
    setShowRatingModal(false);
    setStarRating(0); // Reset star rating when closing modal
    setFeedbackText(""); // Clear feedback text when closing modal
    setFeedbackCategory(""); // Clear feedback category when closing modal
    setFollowUpRequired(false); // Reset follow-up required when closing modal
  };

  const handleRatingSubmit = () => {
    handleRatingSubmission();
    // Implement logic to handle rating submission
    // console.log("Rating submitted!");
    // console.log("Star rating:", starRating);
    // console.log("Feedback:", feedbackText);
    // console.log("Feedback category:", feedbackCategory);
    // console.log("Follow-up required?", followUpRequired);
    closeModal();

    function handleRatingSubmission() {
      // Construct the request body
      const requestBody = {
        rating: starRating, // Replace with actual rating value (e.g., obtained from a form input)
        feedback_text: feedbackText, // Replace with actual feedback text (e.g., obtained from a form input)
        feedback_category: feedbackCategory,
        call: callId,
      };

      // Make POST request using fetch API
      fetch("https://core.proximaai.co/api/call/call/customer-feedback/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${authTokenUser}`,
        },
        body: JSON.stringify(requestBody),
      })
        .then((response) => {
          if (response.ok) {
            return response.json(); // Parse response JSON
          } else {
            throw new Error(`HTTP error! Status: ${response.status}`); // Throw error for non-200 status codes
          }
        })
        .then((data) => {
          console.log("POST request succeeded with JSON response:", data);
          // Handle successful response here (e.g., display success message to user)
          alert("Feedback submitted successfully!");
        })
        .catch((error) => {
          console.error("Error making POST request:", error);
          // Handle error (e.g., display error message to user)
        });
    }

    // Add further logic here for handling rating submission, e.g., API call
  };

  const postTranscriptions = () => {
    const requestBody = {
      transcripts: [{ tenant_iva: "Hello im here to assist you today" }],
      call_satisfaction: true,
      issue_resolution: true,
      call: callId,
    };

    // Log the type of the 'transcripts' property
    console.log(typeof requestBody.transcripts);

    // Token for authorization

    // Make POST request using fetch API
    fetch("https://core.proximaai.co/api/call/call/call-metrics/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${authTokenUser}`,
      },
      body: JSON.stringify(requestBody),
    })
      .then((response) => {
        if (response.ok) {
          return response.json(); // Parse response JSON
        } else {
          throw new Error(`HTTP error! Status: ${response.status}`); // Throw error for non-200 status codes
        }
      })
      .then((data) => {
        console.log("POST request succeeded with JSON response:", data);
        // Handle successful response here (e.g., display success message to user)
        // alert("Rate successfully!");
      })
      .catch((error) => {
        console.error("Error making POST request:", error);
        // Handle error (e.g., display error message to user)
      });
  };

  const resolutions = () => {
    const requestBody = {
      status: "resolved",
      pednding_actions: "string",
      follow_up_required: followUpRequired,
      follow_up_date: "2024-04-18T09:09:12.802",
      call: callId,
    };

    // Log the type of the 'transcripts' property
    console.log(typeof requestBody.transcripts);

    // Token for authorization

    // Make POST request using fetch API
    fetch("https://core.proximaai.co/api/call/call/call-resolution/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${authTokenUser}`,
      },
      body: JSON.stringify(requestBody),
    })
      .then((response) => {
        if (response.ok) {
          return response.json(); // Parse response JSON
        } else {
          throw new Error(`HTTP error! Status: ${response.status}`); // Throw error for non-200 status codes
        }
      })
      .then((data) => {
        console.log("POST request succeeded with JSON response:", data);
        // Handle successful response here (e.g., display success message to user)
        // alert("Call ended successfully!");
      })
      .catch((error) => {
        console.error("Error making POST request:", error);
        // Handle error (e.g., display error message to user)
      });
  };

  const handleStarClick = (rating) => {
    if (!showRatingModal) return; // Allow star rating only when modal is open
    setStarRating(rating);
  };

  const handleFeedbackChange = (event) => {
    setFeedbackText(event.target.value); // Update feedback text state
  };

  const handleCategoryChange = (event) => {
    setFeedbackCategory(event.target.value); // Update feedback category state
  };

  const handleFollowUpChange = (event) => {
    const isChecked = event.target.checked;
    resolutions();
    setFollowUpRequired(isChecked); // Update followUpRequired state with checkbox status
  };


  useEffect(() => {
    const chatSocket = new WebSocket(
      "wss://a528-102-212-236-164.ngrok-free.app/ws/chat/"
    );

    chatSocket.onopen = () => {
      setStatus("Connected");
    };

    chatSocket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setChatLog((prevLog) => prevLog + `Server: ${data.message}\n`);
      if (data.audio_url) {
        const audioElement = new Audio(data.audio_url);
        audioElement.play();
        setIsAudioPlaying(true);
        if (recognition && recognition.state === "listening") {
          recognition.stop();
        }
      }
    };

    chatSocket.onclose = (e) => {
      setStatus("Not Connected");
      setErrorMessage("Connection closed unexpectedly");
      console.error("Chat socket closed unexpectedly");
    };

    // Set up the SpeechRecognition instance
    let recognitionInstance
    if(typeof window !== 'undefined') recognitionInstance = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;

    recognitionInstance.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const finalTranscript = event.results[i][0].transcript;
          setChatLog((prevLog) => prevLog + `You: ${finalTranscript}\n`);
          chatSocket.send(JSON.stringify({ message: finalTranscript }));
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setInputMessage(interimTranscript);
    };

    recognitionInstance.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setErrorMessage(`Speech recognition error: ${event.error}`);
    };

    recognitionInstance.onend = () => {
      setIsAudioPlaying(false);
    };

    // Set the recognition instance in state
    setRecognition(recognitionInstance);

    // Cleanup function
    return () => {
      chatSocket.close();
      if (recognitionInstance) {
        recognitionInstance.abort();
      }
    };
  }, []);

  const handleSendMessage = () => {
    const message = inputMessage.trim();
    if (message) {
      chatSocket.send(JSON.stringify({ message: message }));
      setChatLog((prevLog) => prevLog + `You: ${message}\n`);
      setInputMessage("");
    }
  };

  const handleStartVoiceInput = () => {
    if (recognition && !isAudioPlaying) {
      recognition.start();
      setIsAudioPlaying(true);
    }
  };

  const handleStopVoiceInput = () => {
    if (recognition) {
      recognition.stop();
      setIsAudioPlaying(false);
    }
  };


  return (
    <div
      className={`min-h-screen ${
        darkMode ? "dark" : "light"
      } bg-black text-white relative flex justify-center items-center`}
    >
      <div className="absolute top-0 right-0 m-4">
        <button onClick={toggleDarkMode} className="text-2xl">
          {darkMode ? <FiSun /> : <FiMoon />}
        </button>
      </div>

      {/* Main Content */}
      <div className="text-center">
        {/* User Info */}
        <div className="mb-4">
          <p className="text-xl">{userDetails?.username}</p>
          <p className="text-sm">{tenantDetails?.tenant_name}</p>
        </div>

        {/* Call Status */}
        {callOngoing && (
          <div className="mb-4">
            <p>Ongoing Call</p>
            <p>{formatDuration(callDuration)}</p>
          </div>
        )}

        <input
          type="text"
          className="flex-grow p-3 text-white bg-gray-700 border border-gray-600 rounded-lg shadow"
          placeholder="Type your message here..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
        />
        <div
          className="text-white"
          onChange={(e) => setInputMessage(e.target.value)}
        ></div>

        <div onChange={(e) => setInputMessage(e.target.value)}></div>
        {/* Action Buttons */}
        <div>
          <div className="fixed bottom-0 left-0 right-0 flex justify-center p-4 bg-black">
            <button
              className="mr-4 text-green-500"
              onClick={startCall}
              disabled={callOngoing}
            >
              <FiPhoneCall size={32} />
            </button>
            <button className="mr-4 text-gray-500" onClick={mute}>
              <FiMic size={32} />
            </button>
            <button
              className="text-red-500"
              onClick={endCall}
              disabled={!callOngoing}
            >
              <FiPhoneOff size={32} />
            </button>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed top-0 bottom-0 left-0 right-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-between p-4">
              <h2 className="text-xl font-bold">Rate the Call</h2>
              <button onClick={closeModal}>
                <IoClose
                  className="text-gray-500 cursor-pointer hover:text-gray-800"
                  size={24}
                />
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-center mb-6">
                {[1, 2, 3, 4, 5].map((index) => (
                  <FiStar
                    key={index}
                    className={`text-3xl cursor-pointer ${
                      index <= starRating ? "text-yellow-500" : "text-gray-300"
                    }`}
                    onClick={() => handleStarClick(index)}
                  />
                ))}
              </div>
              <textarea
                placeholder="Enter your feedback..."
                className="w-full p-4 mb-4 text-gray-800 placeholder-gray-400 border rounded focus:outline-none"
                rows={4}
                value={feedbackText}
                onChange={handleFeedbackChange}
              />
              <select
                className="w-full p-4 text-gray-800 border rounded focus:outline-none"
                value={feedbackCategory}
                onChange={handleCategoryChange}
              >
                <option value="">Select category...</option>
                <option value="services">services</option>
              </select>
              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  className="w-4 h-4 mr-2 text-indigo-600 rounded"
                  checked={followUpRequired}
                  onChange={handleFollowUpChange}
                />
                <label className="text-gray-700">Follow-up required?</label>
              </div>
              <button
                className="w-full py-2 mt-4 font-bold text-white bg-green-500 rounded hover:bg-green-600"
                onClick={handleRatingSubmit}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;