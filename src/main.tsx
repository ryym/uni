import { createRoot } from "react-dom/client";

const main = async () => {
  const $root = document.getElementById("root");
  if ($root == null) {
    throw new Error("mount target element not found");
  }
  createRoot($root).render(<h1>Hello world</h1>);
};

main().catch((err) => {
  console.error(err);
});
