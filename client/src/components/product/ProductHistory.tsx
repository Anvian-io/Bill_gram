import React,{useEffect} from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

function History() {
  // Remove ?id from query params on mount
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  // Remove ?id from URL if present on mount
  useEffect(() => {
    if (searchParams.has("id")) {
      searchParams.delete("id");
      // Use setSearchParams to update the URL without the id param
      setSearchParams(searchParams, { replace: true });
    }
  }, []); // Run only on mount
  return <div>History</div>;
}

export default History;
