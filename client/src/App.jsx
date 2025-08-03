import "./App.css";
import Layout from "./components/Layout";
import Counter from "./components/Counter";

export default function App() {
  return (
    <>
      <Layout>
        <div className="flex flex-col items-center">
          <h1 className="text-white text-4xl font-bold text-center mb-10 mt-10">
            Hello World
          </h1>
          <Counter />
        </div>
      </Layout>
    </>
  );
}
