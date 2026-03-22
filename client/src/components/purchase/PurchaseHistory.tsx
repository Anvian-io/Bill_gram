import React,{useEffect} from 'react'
import { useSearchParams, useNavigate } from "react-router-dom";

function PurchaseHistory() {
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
  return <div>Purchase History</div>;
}

export default PurchaseHistory
