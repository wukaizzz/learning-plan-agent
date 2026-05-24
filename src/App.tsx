import './App.css';
import router from './router';
import { RouterProvider } from 'react-router';
function App() {

  return (
    <div className="app">
      <RouterProvider router={router}></RouterProvider>
    </div>
  );
}

export default App;
