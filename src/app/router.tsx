import { createBrowserRouter } from "react-router";
import { Home } from "./routes/home";
import { Login } from "./routes/login";

export const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> },
]);
