// Save in local storage
export const saveArrayInLocalStorage = (key, data) => {
  const questions = JSON.stringify(data);
  localStorage.setItem(key, questions);
}

// Get array from local storage
export const getArrayFromLocalStorage = (key) => {
  const data = localStorage.getItem(key);
  if(!data) return [];

  return JSON.parse(data);
}

// Clear the storage
export const clearStorage = () => {
  window.localStorage.clear();
}