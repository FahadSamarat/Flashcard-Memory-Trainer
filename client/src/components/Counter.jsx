import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)

  const increment = () => setCount(count + 1)
  const decrement = () => setCount(count - 1)
  const reset = () => setCount(0)

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-[300px] mb-7">
      <h3 className="text-xl font-semibold mb-4 text-center">Counter</h3>
      <div className="text-center">
        <div className="text-4xl font-bold text-gray-800 mb-4">{count}</div>
        <div className="flex gap-2 justify-center">
          <button
            onClick={decrement}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            -
          </button>
          <button
            onClick={reset}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Reset
          </button>
          <button
            onClick={increment}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
} 