import '@testing-library/jest-dom';

// jsdom does not implement window.scrollTo, and TanStack Router calls it on
// every navigation. Without this stub the router still works but every
// routing test floods the output with "Not implemented" errors.
window.scrollTo = () => {};
