from django.shortcuts import render

def chat(request):
    return render(request, 'core/chat.html')
