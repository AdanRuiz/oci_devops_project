import React, { useState } from "react";

function NewItem(props: { isInserting: boolean, addItem: (item: any) => void }) {
  const [item, setItem] = useState('');

  function handleSubmit(e: any) {
    e.preventDefault();
    if (!item.trim()) return;
    props.addItem(item);
    setItem("");
  }

  return (
    <div className="new-item-wrap">
      <span className="new-item-prefix">+</span>
      <input
        className="new-item-input"
        placeholder="Add a new task…"
        type="text"
        autoComplete="off"
        value={item}
        onChange={e => setItem(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSubmit(e); }}
      />
      <button
        className="add-btn"
        disabled={props.isInserting || !item.trim()}
        onClick={handleSubmit}
      >
        {props.isInserting ? 'Adding…' : 'Add'}
      </button>
    </div>
  );
}

export default NewItem;
