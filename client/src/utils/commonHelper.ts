export const CheckIsExpanded = () => {
  const nav_expanded_data = localStorage.getItem("IsExpanded");
  if (nav_expanded_data == "false") {
    return false;
  }
  return true;
};
