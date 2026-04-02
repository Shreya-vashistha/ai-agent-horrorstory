import { useRef } from "react";
import StoryTerminal from "./components/storyTerminal";
import "./App.css";

function App() {
  const appRef = useRef(null);

  return (
    <div className="app" ref={appRef}>
      {/* Main UI */}
      <StoryTerminal />
    </div>
  );
}

export default App;