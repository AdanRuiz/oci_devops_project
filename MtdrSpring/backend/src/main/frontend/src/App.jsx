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
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import BugReportIcon from '@mui/icons-material/BugReport';
import moment from 'moment';

function App() {
  const [isLoading, setLoading] = useState(true);
  const [isInserting, setInserting] = useState(false);
  const [items, setItems] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [error, setError] = useState();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentSprint, setCurrentSprint] = useState(null);
  const [visibleSprints, setVisibleSprints] = useState([]);
  const [expandedSprints, setExpandedSprints] = useState({});
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Determine current sprint based on start date
  const determineCurrentSprint = (sprintList) => {
    if (!sprintList || sprintList.length === 0) return null;
    
    const now = moment();
    let current = null;
    
    // Find sprint that has started and hasn't ended
    for (let sprint of sprintList) {
      if (sprint.startDate) {
        const startDate = moment(sprint.startDate);
        const endDate = sprint.endDate ? moment(sprint.endDate) : null;
        
        if (startDate.isBefore(now) && (!endDate || endDate.isAfter(now))) {
          current = sprint;
          break;
        }
      }
    }
    
    // If no current sprint found, use the first one by start date
    if (!current) {
      current = sprintList.sort((a, b) => {
        const dateA = a.startDate ? moment(a.startDate) : moment(0);
        const dateB = b.startDate ? moment(b.startDate) : moment(0);
        return dateB.diff(dateA);
      })[0];
    }
    
    return current;
  };

  const sortSprints = (sprintList, current) => {
    if (!current) return sprintList;
    
    return sprintList.sort((a, b) => {
      if (a.id === current.id) return -1;
      if (b.id === current.id) return 1;
      // Sort by start date descending
      const dateA = a.startDate ? moment(a.startDate) : moment(0);
      const dateB = b.startDate ? moment(b.startDate) : moment(0);
      return dateB.diff(dateA);
    });
  };

  const getSprintTasks = (sprintId) => {
    return items.filter(item => item.sprint?.id === sprintId);
  };

  const filterTasksBySearch = (tasks) => {
    if (!searchTerm.trim()) return tasks;
    
    const lowercaseSearch = searchTerm.toLowerCase();
    return tasks.filter(task => 
      task.title.toLowerCase().includes(lowercaseSearch) ||
      (task.description && task.description.toLowerCase().includes(lowercaseSearch)) ||
      (task.status && task.status.toLowerCase().includes(lowercaseSearch)) ||
      (task.priority && task.priority.toLowerCase().includes(lowercaseSearch))
    );
  };

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
          setItems((prev) => prev.filter((item) => item.id !== deleteId));
        },
        (err) => setError(err)
      );
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [tasksResponse, sprintsResponse] = await Promise.all([
          fetch(API_LIST),
          fetch('/sprints')
        ]);

        if (!tasksResponse.ok) {
          throw new Error('Could not load tasks');
        }

        const tasks = await tasksResponse.json();
        const sprintResult = sprintsResponse.ok ? await sprintsResponse.json() : [];

        if (!cancelled) {
          setItems(tasks);
          setSprints(sprintResult);
          
          // Determine current sprint
          const current = determineCurrentSprint(sprintResult);
          setCurrentSprint(current);
          
          // Initialize visible sprints with only current sprint
          if (current) {
            setVisibleSprints([current.id]);
            setExpandedSprints({ [current.id]: true });
          } else if (sprintResult.length > 0) {
            setVisibleSprints([sprintResult[0].id]);
            setExpandedSprints({ [sprintResult[0].id]: true });
          }
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  function addItem(taskData) {
    setInserting(true);
    const data = {
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      expectedHours: taskData.expectedHours,
      hoursDone: 0,
      isBug: taskData.isBug,
      assignedTo: 1,
      createdBy: 1,
      vector: 'web'
    };

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
      .then((result) => {
        const id = Number(result.headers.get('location'));
        if (!id) {
          throw new Error('Task created but no location header was returned');
        }

        if (!taskData.sprintId) {
          return fetch(API_LIST + '/' + id).then((taskResponse) => {
            if (!taskResponse.ok) {
              throw new Error('Task created but it could not be reloaded');
            }
            return taskResponse.json();
          });
        }

        return fetch('/sprint-tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: {
              sprintId: taskData.sprintId,
              taskId: id
            },
            addedAt: moment().format('YYYY-MM-DDTHH:mm:ss')
          })
        }).then((linkResponse) => {
          if (!linkResponse.ok) {
            throw new Error('Task created, but sprint assignment failed');
          }
          return fetch(API_LIST + '/' + id).then((taskResponse) => {
            if (!taskResponse.ok) {
              throw new Error('Task created but it could not be reloaded');
            }
            return taskResponse.json();
          });
        });
      })
      .then((createdTask) => {
        setItems((prev) => [createdTask, ...prev]);
        setInserting(false);
      })
      .catch((err) => {
        setInserting(false);
        setError(err);
      });
  }

  // Toggle sprint visibility
  const toggleSprintVisibility = (sprintId) => {
    setVisibleSprints(prev => 
      prev.includes(sprintId) 
        ? prev.filter(id => id !== sprintId)
        : [...prev, sprintId].sort((a, b) => {
            const sprintA = sprints.find(s => s.id === a);
            const sprintB = sprints.find(s => s.id === b);
            return sortSprints([sprintA, sprintB], currentSprint)[0].id === a ? -1 : 1;
          })
    );
  };

  // Toggle sprint expanded state
  const toggleSprintExpanded = (sprintId) => {
    setExpandedSprints(prev => ({
      ...prev,
      [sprintId]: !prev[sprintId]
    }));
  };

  return (
    <section className="text-gray-600 body-font min-h-screen bg-gray-50">
      <div className="container mx-auto px-5 py-12 md:py-20">
        <div className="mx-auto max-w-6xl rounded-2xl bg-white shadow-xl ring-1 ring-gray-100">
          <div className="border-b border-gray-100 px-6 py-6 sm:px-8">
            <h1 className="title-font text-3xl font-semibold text-gray-900 sm:text-4xl">
              {currentSprint ? currentSprint.name : 'Sprints'}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">Maneja tus tareas cada dia</p>
          </div>

          <div className="px-6 py-6 sm:px-8">
            <NewItem addItem={addItem} isInserting={isInserting} sprints={sprints} />

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

            {!isLoading && sprints.length > 0 && (
              <div className="mt-8">
                {/* Search and Filter Controls */}
                <div className="mb-6 space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search tasks by title, description, status, or priority..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Filter Button */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowFilterPanel(!showFilterPanel)}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <TuneIcon fontSize="small" />
                      <span>Filter Sprints</span>
                    </button>
                    <span className="text-sm text-gray-600">
                      {visibleSprints.length} of {sprints.length} sprints visible
                    </span>
                  </div>

                  {/* Filter Panel */}
                  {showFilterPanel && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="mb-3 text-sm font-semibold text-gray-900">Toggle Sprint Visibility:</div>
                      <div className="space-y-2">
                        {sortSprints(sprints, currentSprint).map((sprint) => (
                          <label key={sprint.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={visibleSprints.includes(sprint.id)}
                              onChange={() => toggleSprintVisibility(sprint.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                              {sprint.name}
                              {sprint.id === currentSprint?.id && (
                                <span className="ml-2 inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                                  Current
                                </span>
                              )}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sprints Display */}
                <div className="space-y-4">
                  {sortSprints(sprints, currentSprint).map((sprint) => {
                    if (!visibleSprints.includes(sprint.id)) return null;
                    
                    const sprintTasks = getSprintTasks(sprint.id);
                    const filteredTasks = filterTasksBySearch(sprintTasks);
                    const isExpanded = expandedSprints[sprint.id];
                    const isCurrent = sprint.id === currentSprint?.id;

                    return (
                      <div key={sprint.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                        {/* Sprint Header */}
                        <button
                          onClick={() => toggleSprintExpanded(sprint.id)}
                          className={`w-full px-6 py-4 text-left transition hover:bg-gray-50 ${
                            isCurrent ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <KeyboardArrowUpIcon className="text-gray-600" />
                              ) : (
                                <KeyboardArrowDownIcon className="text-gray-600" />
                              )}
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {sprint.name}
                                  {isCurrent && (
                                    <span className="ml-2 inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                                      Current Sprint
                                    </span>
                                  )}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {sprint.startDate && `Start: ${moment(sprint.startDate).format('MMM D, YYYY')}`}
                                  {sprint.endDate && ` • End: ${moment(sprint.endDate).format('MMM D, YYYY')}`}
                                </p>
                              </div>
                            </div>
                            <span className="rounded-full bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700">
                              {filteredTasks.length} tasks
                            </span>
                          </div>
                        </button>

                        {/* Sprint Tasks Table */}
                        {isExpanded && (
                          <div className="border-t border-gray-100">
                            {filteredTasks.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-100 bg-white">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Title
                                      </th>
                                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Type
                                      </th>
                                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Description
                                      </th>
                                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Status
                                      </th>
                                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Priority
                                      </th>
                                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Actions
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {filteredTasks.map((item) => (
                                      <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.title}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                          {item.isBug ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                                              <BugReportIcon fontSize="inherit" />
                                              Bug
                                            </span>
                                          ) : (
                                            <span className="text-gray-400">Task</span>
                                          )}
                                        </td>
                                        <td className="max-w-xs px-6 py-4 text-sm text-gray-700">{item.description || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{item.status}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{item.priority}</td>
                                        <td className="px-6 py-4 text-right">
                                          <button
                                            type="button"
                                            onClick={() => deleteItem(item.id)}
                                            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                                          >
                                            <DeleteIcon fontSize="small" />
                                            <span className="ml-1">Delete</span>
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="px-6 py-8 text-center text-sm text-gray-500">
                                {sprintTasks.length === 0
                                  ? 'No tasks in this sprint.'
                                  : 'No tasks match your search.'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!isLoading && sprints.length === 0 && (
              <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 px-6 py-8 text-center">
                <p className="text-gray-600">No sprints available. Create a sprint to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default App;