/*
## MyToDoReact version 1.0.
##
## Copyright (c) 2022 Oracle, Inc.
## Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl/
*/
import React, { useState, useEffect } from 'react';
import NewItem from './NewItem';
import API_LIST from './API';
import DeleteIcon from '@mui/icons-material/Delete';
import { CircularProgress } from '@mui/material';
import moment from 'moment';

function App() {
  const [isLoading, setLoading] = useState(false);
  const [isInserting, setInserting] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState();

  function deleteItem(deleteId) {
    fetch(API_LIST + '/' + deleteId, {
      method: 'DELETE'
    })
      .then((response) => {
        if (response.ok) return response;
        throw new Error('Something went wrong ...');
      })
      .then(
        () => {
          const remainingItems = items.filter((item) => item.id !== deleteId);
          setItems(remainingItems);
        },
        (err) => setError(err)
      );
  }

  function toggleDone(event, id, description, done) {
    event.preventDefault();
    modifyItem(id, description, done).then(
      () => reloadOneIteam(id),
      (err) => setError(err)
    );
  }

  function reloadOneIteam(id) {
    fetch(API_LIST + '/' + id)
      .then((response) => {
        if (response.ok) return response.json();
        throw new Error('Something went wrong ...');
      })
      .then(
        (result) => {
          const items2 = items.map((x) =>
            x.id === id
              ? {
                  ...x,
                  description: result.description,
                  done: result.done
                }
              : x
          );
          setItems(items2);
        },
        (err) => setError(err)
      );
  }

  function modifyItem(id, description, done) {
    const data = { description, done };
    return fetch(API_LIST + '/' + id, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then((response) => {
      if (response.ok) return response;
      throw new Error('Something went wrong ...');
    });
  }

  useEffect(() => {
    setLoading(true);
    fetch(API_LIST)
      .then((response) => {
        if (response.ok) return response.json();
        throw new Error('Something went wrong ...');
      })
      .then(
        (result) => {
          setLoading(false);
          setItems(result);
        },
        (err) => {
          setLoading(false);
          setError(err);
        }
      );
  }, []);

  function addItem(text) {
    setInserting(true);
    const data = { description: text };

    fetch(API_LIST, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then((response) => {
        if (response.ok) return response;
        throw new Error('Something went wrong ...');
      })
      .then(
        (result) => {
          const id = result.headers.get('location');
          const newItem = { id, description: text };
          setItems([newItem, ...items]);
          setInserting(false);
        },
        (err) => {
          setInserting(false);
          setError(err);
        }
      );
  }

  const todoItems = items.filter((item) => !item.done);
  const doneItems = items.filter((item) => item.done);

  return (
    <section className="text-gray-600 body-font min-h-screen">
      <div className="container mx-auto px-5 py-12 md:py-20">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white shadow-xl ring-1 ring-gray-100">
          <div className="border-b border-gray-100 px-6 py-6 sm:px-8">
            <h1 className="title-font text-3xl font-semibold text-gray-900 sm:text-4xl">Sprint 1</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">Maneja tus tareas cada dia</p>
          </div>

          <div className="px-6 py-6 sm:px-8">
            <NewItem addItem={addItem} isInserting={isInserting} />

            {error && (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                Error: {error.message}
              </p>
            )}

            {isLoading && (
              <div className="mt-8 flex justify-center">
                <CircularProgress />
              </div>
            )}

            {!isLoading && (
              <div className="mt-8 space-y-10">
                <div>
                  <h2 className="mb-4 text-lg font-semibold text-gray-900">To do</h2>
                  <div className="space-y-3">
                    {todoItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-base font-medium text-gray-900">{item.description}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {moment(item.createdAt).format('MMM Do hh:mm:ss')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(event) => toggleDone(event, item.id, item.description, !item.done)}
                          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          Done
                        </button>
                      </div>
                    ))}
                    {todoItems.length === 0 && <p className="text-sm text-gray-500">No pending items.</p>}
                  </div>
                </div>

                <div>
                  <h2 className="mb-4 text-lg font-semibold text-gray-900">Done items</h2>
                  <div className="space-y-3">
                    {doneItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-base font-medium text-gray-700 line-through">{item.description}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {moment(item.createdAt).format('MMM Do hh:mm:ss')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={(event) => toggleDone(event, item.id, item.description, !item.done)}
                            className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400"
                          >
                            Undo
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteItem(item.id)}
                            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            <DeleteIcon fontSize="small" />
                            <span className="ml-1">Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                    {doneItems.length === 0 && <p className="text-sm text-gray-500">No completed items yet.</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default App;