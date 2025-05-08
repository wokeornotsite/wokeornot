"use client";
import React from 'react';
import { Typography, Box } from '@mui/material';
import ContentMoviesTable from './ContentMoviesTable';
import ContentReviewsTable from './ContentReviewsTable';
import { useMovies } from './useMovies';

export default function ContentManagementPage() {
  const { movies, isLoading, mutate } = useMovies();
  
  // Log data to help debug
  React.useEffect(() => {
    console.log('Movies data:', movies);
  }, [movies]);

  return (
    <Box>
      <Typography variant="h4" component="h2" gutterBottom style={{ fontWeight: 800, color: '#38bdf8' }}>
        Content Management
      </Typography>
      <Typography variant="subtitle1" gutterBottom style={{ color: '#a78bfa', marginBottom: 18 }}>
        Edit or remove movies, shows, and reviews. Manage categories and featured content.
      </Typography>
      
      {/* Pass the data to ContentMoviesTable */}
      <ContentMoviesTable 
        movies={movies?.data || []} 
        isLoading={isLoading} 
        mutate={mutate} 
      />
      
      <Box mt={5} />
      <ContentReviewsTable />
    </Box>
  );
}
