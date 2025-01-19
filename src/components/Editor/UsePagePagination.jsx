import { useState, useEffect, } from 'react';

const usePageNavigation = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageInput, setPageInput] = useState('1');
    const [totalPages, setTotalPages] = useState(0);

    const handleTotalPages = (newTotalPages) => {
        setTotalPages(newTotalPages);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handlePageInputChange = (e) => {
        const value = e.target.value;
        if (value === '' || /^\d+$/.test(value)) {
            setPageInput(value);
        }
    };

    const handlePageInputBlur = () => {
        let newPage = parseInt(pageInput, 10);
        if (isNaN(newPage) || newPage < 1) {
            newPage = 1;
        } else if (newPage > totalPages) {
            newPage = totalPages;
        }

        setPageInput(newPage.toString());
        setCurrentPage(newPage);
    };

    const handlePageInputKeyUp = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    };

    useEffect(() => {
        setPageInput(currentPage.toString());
    }, [currentPage]);

    return {
        currentPage,
        pageInput,
        totalPages,
        handlePrevPage,
        handleNextPage,
        handlePageInputChange,
        handlePageInputBlur,
        handlePageInputKeyUp,
        handleTotalPages,
    };
};

export default usePageNavigation;
