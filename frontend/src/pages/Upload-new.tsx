import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, X, Tv, ChevronDown, ChevronUp, Check, Clock, GitBranch } from 'lucide-react';
import toast from 'react-hot-toast';
import { videosApi, professionalsApi } from '../services/api';
import { Professional } from '../types';
import { LoadingSpinner, DateInput } from '../components/ui';
import { formatFileSize } from '../utils/formatters';

interface VideoFormData {
  file: File;
  title: string;
  requestDate: string;
  completionDate: string;
  professionalId: string;
  isTv: boolean;
  tvTitle: string;
  isOpen: boolean;
  isVersion: boolean;
  originalVideoIndex: number | null;
  customDurationSeconds: string; // Empty string or number as string
}

// Helper function to detect if filename is a version
// Example: "INAUGURACAO FRANCA.mp4" (original) vs "INAUGURACAO FRANCA stories.mp4" (version)
function detectVersion(filename: string, allFilenames: string[]): { isVersion: boolean; originalIndex: number | null } {
  const cleanName = (name: string) => name.replace(/\.[^/.]+$/, '').toLowerCase().trim();
  const currentClean = cleanName(filename);
  
  // Check if this file is a version of another
  for (let i = 0; i < allFilenames.length; i++) {
    const otherClean = cleanName(allFilenames[i]);
    
    // Skip if same file
    if (currentClean === otherClean) continue;
    
    // Check if current file contains the other filename (meaning it's a version)
    // Example: "inauguracao-franca-stories" contains "inauguracao-franca"
    if (currentClean.includes(otherClean) && currentClean !== otherClean) {
      return { isVersion: true, originalIndex: i };
    }
  }
  
  return { isVersion: false, originalIndex: null };
}

