import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

const RouteGuard = ({ children, user, requiredRole }) => {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    // Проверяем наличие токена
    const token = localStorage.getItem("token");

    // Если токена нет, сразу запрещаем доступ
    if (!token) {
      setHasAccess(false);
      setIsChecking(false);
      return;
    }

    // Проверяем наличие пользователя
    if (!user) {
      // Не меняем hasAccess - дождемся данных пользователя
      // Если через 2 секунды все еще нет пользователя, возможно токен неверный
      const timeout = setTimeout(() => {
        if (!user) {
          setHasAccess(false);
          setIsChecking(false);
        }
      }, 2000);

      return () => clearTimeout(timeout);
    }

    // Проверяем роли, если они требуются
    if (requiredRole) {
      if (Array.isArray(requiredRole)) {
        if (!requiredRole.includes(user.role)) {
          setHasAccess(false);
          setIsChecking(false);
          return;
        }
      } else {
        if (user.role !== requiredRole) {
          setHasAccess(false);
          setIsChecking(false);
          return;
        }
      }
    }

    // Если все проверки прошли, разрешаем доступ
    setHasAccess(true);
    setIsChecking(false);
  }, [user, requiredRole, location.pathname]);

  // Пока идет проверка, можно показать заглушку или null
  if (isChecking) {
    return null; // или заглушку загрузки
  }

  // Если доступ не разрешен, перенаправляем
  if (!hasAccess) {
    // Если нет пользователя или токена, перенаправляем на логин
    if (!user || !localStorage.getItem("token")) {
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
    // Если пользователь есть, но недостаточно прав, перенаправляем на главную
    return <Navigate to="/" replace />;
  }

  // Если все проверки пройдены, отображаем дочерний компонент
  return children;
};

export default RouteGuard;
