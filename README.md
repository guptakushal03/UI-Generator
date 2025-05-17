# UI Whiteboard Designer

A web-based application for designing user interfaces using a whiteboard-style canvas, with real-time code generation and live preview capabilities.

## Features
- **Interactive Whiteboard**: Draw and manipulate UI elements (div, button, input, freehand) on a canvas.
- **Element Management**: Select, resize, group, copy, paste, and delete elements.
- **Code Generation**: Generate HTML and CSS based on the whiteboard design via a FastAPI backend.
- **Code Editor**: Edit generated code using a Monaco Editor with copy and download functionalities.
- **Live Preview**: View real-time rendering of the generated code in an iframe.
- **Undo/Redo**: Support for undoing and redoing actions on the canvas.
- **Save/Load UI**: Download and upload whiteboard designs as JSON files.
- **Responsive Design**: CSS includes media queries for mobile and tablet views.

## Technologies
- **Backend**:
  - FastAPI: For handling API requests and generating HTML/CSS.
  - Pydantic: For data validation.
  - CORS Middleware: To allow cross-origin requests.
- **Frontend**:
  - React: For building the user interface.
  - Monaco Editor: For code editing.
  - Prettier: For code formatting.
  - React Icons: For toolbar icons.
  - Canvas API: For whiteboard rendering.
- **Dependencies**:
  - Node.js (for frontend)
  - Python (for backend)
  - npm/yarn (for frontend package management)
  - pip (for Python package management)

## Prerequisites
- **Node.js** (>= 16.x)
- **Python** (>= 3.8)
- **npm** or **yarn**
- **pip**
- A modern web browser (Chrome, Firefox, Edge, etc.)

## Installation
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/guptakushal03/UI-Generator.git
   cd ui-whiteboard-designer
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   pip install fastapi uvicorn pydantic
   ```

3. **Frontend Setup**:
   ```bash
   cd frontend
   npm install  # or yarn install
   ```

## Usage
1. **Run the Backend**:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```
   The FastAPI server will run on `http://localhost:8000`.

2. **Run the Frontend**:
   ```bash
   cd frontend
   npm start  # or yarn start
   ```
   The React app will run on `http://localhost:3000`.

3. **Access the Application**:
   Open your browser and navigate to `http://localhost:3000`. You will see:
   - A whiteboard canvas for designing UI elements.
   - A toolbar to switch between draw/select modes, choose element types, and perform actions like generate code, save/load UI, and clear canvas.
   - A code editor displaying generated HTML/CSS.
   - A live preview showing the rendered design.

4. **Designing a UI**:
   - Use **Draw Mode** to create elements (div, button, input, freehand).
   - Use **Select Mode** to manipulate elements (resize, move, group, delete).
   - Click **Generate Code** to produce HTML/CSS based on the canvas.
   - Edit the code in the editor or download it as an HTML file.
   - Use keyboard shortcuts:
     - `Ctrl+Z`: Undo
     - `Ctrl+Y`: Redo
     - `Ctrl+C`: Copy selected elements
     - `Ctrl+V`: Paste elements
     - `Ctrl+G`: Group selected elements
     - `Ctrl+Shift+G`: Ungroup selected group
     - `Delete`: Delete selected elements

## Project Structure
```
ui-whiteboard-designer/
├── backend/
│   ├── main.py                 # FastAPI server and code generation logic
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Whiteboard.jsx  # Canvas-based whiteboard component
│   │   │   ├── CodeEditor.jsx  # Monaco editor for code
│   │   │   ├── LivePreview.jsx # Iframe for live preview
│   │   ├── App.jsx             # Main React component
│   │   └── main.js             # Entry point
│   └── package.json            # Frontend dependencies
├── README.md                   # Project documentation
└── .gitignore                  # Git ignore file
```