// Push to history
export const add = (stateObj, title, url) => {
    history.pushState({stateObj}, title, url);  
};