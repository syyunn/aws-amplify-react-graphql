// Default React import
import React from "react";
import "./App.css";

// AWS-amplify import
import API, { graphqlOperation } from "@aws-amplify/api";
import PubSub from "@aws-amplify/pubsub";

// Graph-QL
import { createTodo } from "./graphql/mutations";
import { listTodos } from "./graphql/queries";
import { onCreateTodo } from "./graphql/subscriptions";

// React hooks
import { useEffect, useReducer } from "react";

// AWS Configurations
import config from "./aws-exports";
API.configure(config);
PubSub.configure(config);

// Functionalites
// F-1. creation of New Todo item
async function createNewTodo() {
  const todo = { name: "Use AppSync", description: "Realtime and Offline" };
  await API.graphql(graphqlOperation(createTodo, { input: todo }));
}

// F-2. filter out the Todo list
const initialState = { todos: [] };
const reducer = (state, action) => {
  switch (action.type) {
    case "QUERY":
      return { ...state, todos: action.todos };
    case "SUBSCRIPTION":
      return { ...state, todos: [...state.todos, action.todo] };
    default:
      return state;
  }
};

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  console.log("state", state);
  console.log("dispatch", dispatch);

  async function getData() {
    const todoData = await API.graphql(graphqlOperation(listTodos));
    console.log("todoData", todoData);
    dispatch({ type: "QUERY", todos: todoData.data.listTodos.items }); // dispatch the queried "data" into the "state"
  }

  useEffect(() => {
    // Fecth Current Data
    getData();

    // Update the Newly Created List
    const subscription = API.graphql(graphqlOperation(onCreateTodo)).subscribe({
      next: eventData => {
        const todo = eventData.value.data.onCreateTodo;
        dispatch({ type: "SUBSCRIPTION", todo }); // dispatch update the state variable
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div>
      <div className="App">
        <button onClick={createNewTodo}>Add Todo</button>
      </div>
      <div>
        {state.todos.map((todo, i) => (
          <p key={(todo, i)}>
            {todo.name} : {todo.description}
          </p>
        ))}
      </div>
    </div>
  );
}

export default App;
