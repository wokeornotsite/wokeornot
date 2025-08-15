"use client";
import React from 'react';
import Link from 'next/link';
import { Breadcrumbs, Typography } from '@mui/material';

export default function AdminBreadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2, color: '#a78bfa' }}>
      {items.map((item, idx) =>
        item.href ? (
          <Link key={idx} href={item.href} style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>
            {item.label}
          </Link>
        ) : (
          <Typography key={idx} color="#f3f4f6" fontWeight={800}>
            {item.label}
          </Typography>
        )
      )}
    </Breadcrumbs>
  );
}
