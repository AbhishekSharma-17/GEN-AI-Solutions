from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.tools import tool
from langchain_core.prompts import ChatPromptTemplate
from IPython.display import Image, display
from langchain_openai import ChatOpenAI
import requests
import matplotlib.pyplot as plt
import io
import re
import os
from dotenv import load_dotenv

load_dotenv()


# Initialize the local llm
llm = ChatOpenAI(api_key=os.getenv("OPENAI_API_KEY"),model= "gpt-4o")


# Define the tools for the agent to use
@tool
def search(query: str):
    """Get current weather for a location using OpenWeatherMap API"""
    # Extract location from query
    if "weather in " in query.lower():
        location = query.lower().split("temperature in ")[-1].strip()
    else:
        location = query.strip()
    #print(location)
    
    # Get coordinates first
    API_KEY = os.getenv("OPENWEATHERMAP_API_KEY")
    geo_url = f"http://api.openweathermap.org/geo/1.0/direct?q={location}&limit=1&appid={API_KEY}"
    
    try:
        geo_response = requests.get(geo_url)
        geo_data = geo_response.json()
        if not geo_data:
            return "Location not found"
            
        lat = geo_data[0]['lat']
        lon = geo_data[0]['lon']
        
        # Get weather data
        weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
        print(weather_url)
        weather_response = requests.get(weather_url)
        weather_data = weather_response.json()
        
        temp = weather_data['main']['temp']
        description = weather_data['weather'][0]['description']
        return f"{temp}°C with {description}"
        
    except Exception as e:
        print(e)
        return f"Error fetching weather: {str(e)}"


@tool
def graph_generation(query: str):
    """Generate temperature line graph from query containing temperature data.
    The temperature data is in the form of a string with temperatures in past X days separated by ",".
    """
    
    try:
        # Extract temperature values using regex
        temps = list(map(float, re.findall(r'\d+\.?\d*', query)))
        if not temps:
            return "No temperature values found in query"
            
        plt.switch_backend('Agg')  # Needed for non-GUI environments
        plt.figure(figsize=(10, 5))
        plt.plot(temps, marker='o', linestyle='-', color='r')
        plt.title('Temperature Trend')
        plt.xlabel('Time (hours)')
        plt.ylabel('Temperature (°C)')
        plt.grid(True)
        
        # Save to in-memory buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        
        # Save to file
        with open('temperature_plot.png', 'wb') as f:
            f.write(buf.read())
            
        plt.close()
        return "Temperature graph saved to temperature_plot.png"
        
    except Exception as e:
        return f"Error generating image: {str(e)}"


tools = [search, graph_generation]

# Initialize memory to persist state between graph runs
checkpointer = MemorySaver()

app = create_react_agent(llm, tools, checkpointer=checkpointer)

# Get the image data and save to file
image_data = app.get_graph().draw_mermaid_png()
with open('agent_graph.png', 'wb') as f:
    f.write(image_data)# Keep displaying if needed


# Use the agent
final_state = app.invoke(
    {"messages": [{"role": "user", "content": "Find the temperature in pune in past 7 days and then plot a graph. Today, the date is 5th Feb 2025."}]},
    config={"configurable": {"thread_id": 42}}
)
print(final_state["messages"][-1].content)