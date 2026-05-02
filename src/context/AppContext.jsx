import React, { createContext, useEffect, useMemo, useState } from "react";
import {
  analysisApi,
  authApi,
  form16Api,
  panApi,
  tasksApi,
} from "../services/api";

// Create context for managing global app state
export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [panData, setPanData] = useState(null);
  const [form16Data, setForm16Data] = useState(null);
  const [taxAnalysis, setTaxAnalysis] = useState(null);
  const [complianceTasks, setComplianceTasks] = useState([]);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setPanData(null);
    setForm16Data(null);
    setTaxAnalysis(null);
    setComplianceTasks([]);
    localStorage.removeItem("user");
  };

  const hydrateLocalUser = () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setIsLoading(false);
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      handleLogin(parsedUser);
    } catch (_err) {
      localStorage.removeItem("user");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserData = async (userId) => {
    const [panResult, form16Result, analysisResult, taskResult] =
      await Promise.allSettled([
        panApi.getByUserId(userId),
        form16Api.getByUserId(userId),
        analysisApi.getByUserId(userId),
        tasksApi.getByUserId(userId),
      ]);

    if (panResult.status === "fulfilled" && panResult.value?.data) {
      const panRecord = panResult.value.data;
      setPanData({
        ...panRecord,
        aadhaar_linked:
          panRecord.aadhaar_linked ||
          (panRecord.aadhaar_linked_status === "Linked"
            ? "Yes"
            : panRecord.aadhaar_linked_status === "Not Linked"
              ? "No"
              : "Unknown"),
      });
    }

    if (form16Result.status === "fulfilled" && form16Result.value?.data) {
      setForm16Data(form16Result.value.data);
    }

    if (analysisResult.status === "fulfilled" && analysisResult.value?.data) {
      setTaxAnalysis(analysisResult.value.data);
    }

    if (
      taskResult.status === "fulfilled" &&
      Array.isArray(taskResult.value?.data)
    ) {
      setComplianceTasks(taskResult.value.data);
    }
  };

  useEffect(() => {
    hydrateLocalUser();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    fetchUserData(user.id);
  }, [user?.id]);

  const registerUser = async ({ name, email, password, userType }) => {
    const response = await authApi.register({
      name,
      email,
      password,
      user_type: userType,
    });

    handleLogin(response.data);
    return response.data;
  };

  const loginUser = async ({ email, password }) => {
    const response = await authApi.login({ email, password });
    handleLogin(response.data);
    return response.data;
  };

  const savePanDetails = async (data) => {
    if (!user?.id) {
      throw new Error("Please login first.");
    }

    const payload = {
      user_id: user.id,
      pan_number: data.pan_number,
      name_on_pan: data.name_on_pan,
      dob: data.dob,
    };

    const response = await panApi.save(payload);
    const saved = response.data;

    setPanData({
      ...saved,
      aadhaar_linked:
        saved.aadhaar_linked ||
        (saved.aadhaar_linked_status === "Linked"
          ? "Yes"
          : saved.aadhaar_linked_status === "Not Linked"
            ? "No"
            : "Unknown"),
    });

    return saved;
  };

  const saveForm16Details = async (data) => {
    if (!user?.id) {
      throw new Error("Please login first.");
    }

    const payload = {
      user_id: user.id,
      financial_year: data.financial_year,
      gross_salary: Number(data.gross_salary),
      deductions: Number(data.deductions),
      tds_deducted: Number(data.tds_deducted),
    };

    const analysisResponse = await form16Api.save(payload);

    setForm16Data({
      ...payload,
      taxable_income: Number(payload.gross_salary) - Number(payload.deductions),
    });

    setTaxAnalysis(analysisResponse.data);

    const tasksResponse = await tasksApi.getByUserId(user.id);
    setComplianceTasks(
      Array.isArray(tasksResponse.data) ? tasksResponse.data : [],
    );

    return analysisResponse.data;
  };

  const updateTaskStatus = async (taskId) => {
    const response = await tasksApi.markComplete(taskId);
    const updatedTask = response.data;

    setComplianceTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === updatedTask.id ? updatedTask : task,
      ),
    );

    return updatedTask;
  };

  const value = useMemo(
    () => ({
      user,
      isLoggedIn,
      isLoading,
      panData,
      form16Data,
      taxAnalysis,
      complianceTasks,
      handleLogin,
      handleLogout,
      registerUser,
      loginUser,
      savePanDetails,
      saveForm16Details,
      updateTaskStatus,
    }),
    [
      user,
      isLoggedIn,
      isLoading,
      panData,
      form16Data,
      taxAnalysis,
      complianceTasks,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
