import {
  type RouteConfig,
  route,
  index,
  layout,
  prefix,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("todos", "routes/todos.tsx"),
  route("weather", "routes/weather.tsx"),
] satisfies RouteConfig;
