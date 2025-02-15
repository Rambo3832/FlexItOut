
import Auth from "./Auth";

function App() {
  return (
    <div>
      <Auth />
    </div>
  );
}

export default App;



// import { useEffect, useState } from "react";

// function App() {
//   const [message, setMessage] = useState("");

//   useEffect(() => {
//     fetch("http://localhost:5000/")
//       .then((res) => res.text())
//       .then((data) => setMessage(data));
//   }, []);

//   return (
//     <div className="flex items-center justify-center h-screen text-xl font-bold">
//       {message || "Loading..."}
//     </div>
//   );
// }

// export default App;

