
// ABOUTME: Hook for managing technician time tracking functionality
// ABOUTME: Provides methods to start, stop, and calculate work time for technicians

import { useState } from 'react';
import { TechnicianWorkLog, ServiceTimeTracking } from '@/types/timeTracking';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'gestor-pro-time-tracking';

function getTimeTrackingData(): TechnicianWorkLog[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveTimeTrackingData(logs: TechnicianWorkLog[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

export function useTimeTracking() {
  const [workLogs, setWorkLogs] = useState<TechnicianWorkLog[]>(getTimeTrackingData());

  const startWork = (serviceId: string, technicianId: string, description?: string): TechnicianWorkLog => {
    const newLog: TechnicianWorkLog = {
      id: uuidv4(),
      serviceId,
      technicianId,
      startTime: new Date().toISOString(),
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedLogs = [...workLogs, newLog];
    setWorkLogs(updatedLogs);
    saveTimeTrackingData(updatedLogs);
    
    return newLog;
  };

  const stopWork = (logId: string): TechnicianWorkLog | null => {
    const logIndex = workLogs.findIndex(log => log.id === logId);
    if (logIndex === -1) return null;

    const endTime = new Date().toISOString();
    const startTime = new Date(workLogs[logIndex].startTime);
    const totalMinutes = Math.round((new Date(endTime).getTime() - startTime.getTime()) / (1000 * 60));

    const updatedLog: TechnicianWorkLog = {
      ...workLogs[logIndex],
      endTime,
      totalMinutes,
      updatedAt: new Date().toISOString()
    };

    const updatedLogs = [...workLogs];
    updatedLogs[logIndex] = updatedLog;
    
    setWorkLogs(updatedLogs);
    saveTimeTrackingData(updatedLogs);
    
    return updatedLog;
  };

  const getServiceTimeTracking = (serviceId: string): ServiceTimeTracking => {
    const serviceLogs = workLogs.filter(log => log.serviceId === serviceId);
    const totalMinutes = serviceLogs.reduce((sum, log) => sum + (log.totalMinutes || 0), 0);
    
    return {
      serviceId,
      totalMinutes,
      technicianLogs: serviceLogs
    };
  };

  const getActiveWork = (technicianId: string): TechnicianWorkLog | null => {
    return workLogs.find(log => log.technicianId === technicianId && !log.endTime) || null;
  };

  return {
    workLogs,
    startWork,
    stopWork,
    getServiceTimeTracking,
    getActiveWork
  };
}
