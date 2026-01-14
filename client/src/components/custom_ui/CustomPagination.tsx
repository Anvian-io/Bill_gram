import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface CustomPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const CustomPagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: CustomPaginationProps) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number | string) => {
    if (typeof page === "number") {
      onPageChange(page);
    }
  };

  const getDesktopPages = (): (number | string)[] => {
    if (totalPages <= 1) return [1];

    let pages: (number | string)[] = [];
    pages.push(1);

    if (currentPage > 3) pages.push("...");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      if (i > 1 && i < totalPages) pages.push(i);
    }

    if (currentPage < totalPages - 2) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  const getMobilePages = (): (number | string)[] => {
    if (totalPages <= 1) return [1];

    let pages: (number | string)[] = [1];

    if (totalPages === 2) {
      pages.push(2);
      return pages;
    }

    if (currentPage !== 1 && currentPage !== totalPages) {
      pages.push("...", currentPage, "...");
    } else {
      pages.push("...");
    }

    pages.push(totalPages);
    return pages;
  };

  const desktopPages = getDesktopPages();
  const mobilePages = getMobilePages();

  return (
    <Pagination className="mb-10">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={handlePrevious}
            // disabled={currentPage === 1}
            className="px-2 sm:px-4 cursor-pointer"
          />
        </PaginationItem>

        <div className="hidden sm:flex">
          {desktopPages.map((page, idx) => (
            <PaginationItem key={`desktop-${page}-${idx}`}>
              {page === "..." ? (
                <span className="px-2">...</span>
              ) : (
                <PaginationLink
                  isActive={currentPage === page}
                  onClick={() => handlePageClick(page)}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
        </div>

        <div className="flex sm:hidden">
          {mobilePages.map((page, idx) => (
            <PaginationItem key={`mobile-${page}-${idx}`}>
              {page === "..." ? (
                <span className="px-2">...</span>
              ) : (
                <PaginationLink
                  isActive={currentPage === page}
                  onClick={() => handlePageClick(page)}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
        </div>

        <PaginationItem>
          <PaginationNext
            onClick={handleNext}
            // disabled={currentPage === totalPages}
            className="px-2 sm:px-4 cursor-pointer"
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
