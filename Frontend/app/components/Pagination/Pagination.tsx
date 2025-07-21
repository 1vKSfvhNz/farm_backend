import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PaginationProps } from '../../interfaces/pagination';

export const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  maxVisibleButtons = 5 
}: PaginationProps) => {
  
  // Generate the array of page numbers to display
  const pageNumbers = useMemo(() => {
    // If we have fewer pages than the max visible buttons, show all pages
    if (totalPages <= maxVisibleButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Calculate how many buttons to show on each side of the current page
    const sideButtons = Math.floor(maxVisibleButtons / 2);
    
    let startPage = Math.max(currentPage - sideButtons, 1);
    let endPage = Math.min(startPage + maxVisibleButtons - 1, totalPages);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisibleButtons) {
      startPage = Math.max(endPage - maxVisibleButtons + 1, 1);
    }
    
    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  }, [currentPage, totalPages, maxVisibleButtons]);
  
  // Style for active page
  const getButtonStyle = (page: number) => {
    return page === currentPage
      ? [styles.pageButton, styles.activePageButton, { backgroundColor: '#fff' }]
      : styles.pageButton;
  };
  
  // Style for text in button
  const getTextStyle = (page: number) => {
    return page === currentPage
      ? [styles.pageButtonText, styles.activePageButtonText]
      : styles.pageButtonText;
  };
  
  return (
    <View style={styles.container}>
      {/* Previous button */}
      <TouchableOpacity
        style={[styles.navButton, currentPage === 1 && styles.disabledButton]}
        onPress={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <Text style={styles.navButtonText}>«</Text>
      </TouchableOpacity>
      
      {/* First page button with ellipsis if needed */}
      {pageNumbers[0] > 1 && (
        <>
          <TouchableOpacity
            style={styles.pageButton}
            onPress={() => onPageChange(1)}
          >
            <Text style={styles.pageButtonText}>1</Text>
          </TouchableOpacity>
          {pageNumbers[0] > 2 && (
            <Text style={styles.ellipsis}>...</Text>
          )}
        </>
      )}
      
      {/* Page number buttons */}
      {pageNumbers.map(page => (
        <TouchableOpacity
          key={page}
          style={getButtonStyle(page)}
          onPress={() => onPageChange(page)}
        >
          <Text style={getTextStyle(page)}>{page}</Text>
        </TouchableOpacity>
      ))}
      
      {/* Last page button with ellipsis if needed */}
      {pageNumbers[pageNumbers.length - 1] < totalPages && (
        <>
          {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
            <Text style={styles.ellipsis}>...</Text>
          )}
          <TouchableOpacity
            style={styles.pageButton}
            onPress={() => onPageChange(totalPages)}
          >
            <Text style={styles.pageButtonText}>{totalPages}</Text>
          </TouchableOpacity>
        </>
      )}
      
      {/* Next button */}
      <TouchableOpacity
        style={[styles.navButton, currentPage === totalPages && styles.disabledButton]}
        onPress={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <Text style={styles.navButtonText}>»</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  pageButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
    backgroundColor: '#f0f0f0',
  },
  activePageButton: {
    backgroundColor: '#007bff', // Will be overridden by theme color
  },
  pageButtonText: {
    fontSize: 14,
    color: '#333',
  },
  activePageButtonText: {
    color: 'white',
  },
  navButton: {
    width: 40,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
    backgroundColor: '#f0f0f0',
  },
  disabledButton: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 18,
    color: '#333',
  },
  ellipsis: {
    fontSize: 14,
    marginHorizontal: 3,
  },
});