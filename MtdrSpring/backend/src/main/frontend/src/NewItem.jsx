/*
## MyToDoReact version 1.0.
##
## Copyright (c) 2022 Oracle, Inc.
## Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl/
*/
/*
 * Component that supports creating a new todo item.
 * @author  jean.de.lavarene@oracle.com
 */

import React, { useState } from "react";

function NewItem(props) {
  const [item, setItem] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!item.trim()) return;
    props.addItem(item);
    setItem("");
  }

  function handleChange(e) {
    setItem(e.target.value);
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          placeholder="New item"
          type="text"
          autoComplete="off"
          value={item}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
        />
        <button
          type="submit"
          disabled={props.isInserting}
          className="inline-flex items-center justify-center rounded-lg bg-red-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {props.isInserting ? "Adding..." : "Add"}
        </button>
      </form>
    </div>
  );
}

export default NewItem;