import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../core/api/supabaseClient';
import { pickPhoto } from '../core/permissions/pickPhoto';
import { colors } from '../core/theme/colors';
import { SupabaseAuthRepository } from '../features/auth/data/repositories/SupabaseAuthRepository';
import { User } from '../features/auth/domain/entities/User';
import { AuthenticateUser } from '../features/auth/domain/useCases/AuthenticateUser';
import { ChangePassword } from '../features/auth/domain/useCases/ChangePassword';
import { LoginWithPin } from '../features/auth/domain/useCases/LoginWithPin';
import { RegisterGuardian } from '../features/auth/domain/useCases/RegisterGuardian';
import { RestoreSession } from '../features/auth/domain/useCases/RestoreSession';
import { SignOut } from '../features/auth/domain/useCases/SignOut';
import { AuthScreen } from '../features/auth/presentation/screens/AuthScreen';
import { ChangePasswordScreen } from '../features/auth/presentation/screens/ChangePasswordScreen';
import { PinLoginScreen } from '../features/auth/presentation/screens/PinLoginScreen';
import { RegisterScreen } from '../features/auth/presentation/screens/RegisterScreen';
import { SupabaseInstitutionAdminRepository } from '../features/institution/data/repositories/SupabaseInstitutionAdminRepository';
import { School } from '../features/institution/domain/entities/School';
import { ManageSchools } from '../features/institution/domain/useCases/ManageSchools';
import { ManageStaff } from '../features/institution/domain/useCases/ManageStaff';
import { AdminSchoolsScreen } from '../features/institution/presentation/screens/AdminSchoolsScreen';
import { SchoolStaffScreen } from '../features/institution/presentation/screens/SchoolStaffScreen';
import { SupabaseEnrollmentRepository } from '../features/institution/data/repositories/SupabaseEnrollmentRepository';
import { PendingEnrollment } from '../features/institution/domain/entities/EnrollmentReview';
import { ValidateEnrollment } from '../features/institution/domain/useCases/ValidateEnrollment';
import { EnrollmentReviewScreen } from '../features/institution/presentation/screens/EnrollmentReviewScreen';
import { PendingEnrollmentsScreen } from '../features/institution/presentation/screens/PendingEnrollmentsScreen';
import { SupabaseProtegidoRepository } from '../features/profile/data/repositories/SupabaseProtegidoRepository';
import { Protegido } from '../features/profile/domain/entities/Protegido';
import { AssignPin } from '../features/profile/domain/useCases/AssignPin';
import { ListMyProtegidos } from '../features/profile/domain/useCases/ListMyProtegidos';
import { RegisterProtegido } from '../features/profile/domain/useCases/RegisterProtegido';
import { AssignPinScreen } from '../features/profile/presentation/screens/AssignPinScreen';
import { GuardianHomeScreen } from '../features/profile/presentation/screens/GuardianHomeScreen';
import { ProtegidoHomeScreen } from '../features/profile/presentation/screens/ProtegidoHomeScreen';
import { RegisterProtegidoScreen } from '../features/profile/presentation/screens/RegisterProtegidoScreen';
import { SupabaseRouteRepository } from '../features/routes/data/repositories/SupabaseRouteRepository';
import { Route, RouteDirection } from '../features/routes/domain/entities/Route';
import { ManageRoutes } from '../features/routes/domain/useCases/ManageRoutes';
import { RouteEditorScreen } from '../features/routes/presentation/screens/RouteEditorScreen';
import { RoutesScreen } from '../features/routes/presentation/screens/RoutesScreen';
import { SplashScreen } from '../features/splash/presentation/screens/SplashScreen';

type AuthRoute = 'login' | 'register' | 'pinLogin';
type GuardianRoute = 'home' | 'registerProtegido';

export function AppContent() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [isSessionRestored, setIsSessionRestored] = useState(false);
  const [authRoute, setAuthRoute] = useState<AuthRoute>('login');
  const [loggedUser, setLoggedUser] = useState<User | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [guardianRoute, setGuardianRoute] = useState<GuardianRoute>('home');
  const [reviewedEnrollment, setReviewedEnrollment] = useState<PendingEnrollment | null>(null);
  const [pinProtegido, setPinProtegido] = useState<Protegido | null>(null);
  const [routesProtegido, setRoutesProtegido] = useState<Protegido | null>(null);
  const [editedRoute, setEditedRoute] = useState<{
    direction: RouteDirection;
    route: Route | null;
  } | null>(null);

  // Raíz de composición: la única parte de la app que conoce la capa data.
  const useCases = useMemo(() => {
    const repository = new SupabaseAuthRepository(supabase.auth, supabase.functions);
    const institutionAdmin = new SupabaseInstitutionAdminRepository(supabase);
    const protegidos = new SupabaseProtegidoRepository(supabase);
    return {
      listMyProtegidos: new ListMyProtegidos(protegidos),
      registerProtegido: new RegisterProtegido(protegidos),
      authenticateUser: new AuthenticateUser(repository),
      changePassword: new ChangePassword(repository),
      loginWithPin: new LoginWithPin(repository),
      assignPin: new AssignPin(protegidos),
      registerGuardian: new RegisterGuardian(repository),
      restoreSession: new RestoreSession(repository),
      signOut: new SignOut(repository),
      manageSchools: new ManageSchools(institutionAdmin),
      manageStaff: new ManageStaff(institutionAdmin),
      validateEnrollment: new ValidateEnrollment(new SupabaseEnrollmentRepository(supabase)),
      manageRoutes: new ManageRoutes(new SupabaseRouteRepository(supabase)),
    };
  }, []);

  // E1-05: al abrir la app se recupera la sesión cifrada; si luego vence o se
  // revoca (refresh token rotativo), la app vuelve a la pantalla de ingreso.
  useEffect(() => {
    let isMounted = true;
    useCases.restoreSession.execute().then((user) => {
      if (!isMounted) return;
      setLoggedUser(user);
      setIsSessionRestored(true);
    });
    const stopObserving = useCases.restoreSession.observe((user) => {
      if (isMounted) setLoggedUser(user);
    });
    return () => {
      isMounted = false;
      stopObserving();
    };
  }, [useCases]);

  const handleSplashFinish = useCallback(() => setIsSplashVisible(false), []);
  const handleSignedIn = useCallback((user: User) => setLoggedUser(user), []);
  const goToLogin = useCallback(() => setAuthRoute('login'), []);
  const goToRegister = useCallback(() => setAuthRoute('register'), []);

  const handleSignOut = useCallback(async () => {
    await useCases.signOut.execute();
    setLoggedUser(null);
    setSelectedSchool(null);
    setGuardianRoute('home');
    setReviewedEnrollment(null);
    setPinProtegido(null);
    setRoutesProtegido(null);
    setEditedRoute(null);
    setAuthRoute('login');
  }, [useCases]);

  if (isSplashVisible || !isSessionRestored) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (!loggedUser) {
    if (authRoute === 'pinLogin') {
      return (
        <PinLoginScreen
          loginWithPin={useCases.loginWithPin}
          onLoginSuccess={handleSignedIn}
          onBack={goToLogin}
        />
      );
    }
    return authRoute === 'register' ? (
      <RegisterScreen
        registerGuardian={useCases.registerGuardian}
        onSignedIn={handleSignedIn}
        onGoToLogin={goToLogin}
      />
    ) : (
      <AuthScreen
        authenticateUser={useCases.authenticateUser}
        onLoginSuccess={handleSignedIn}
        onGoToRegister={goToRegister}
        onGoToPinLogin={() => setAuthRoute('pinLogin')}
      />
    );
  }

  // SEC-03: con la contraseña temporal no se puede hacer nada más que cambiarla.
  if (loggedUser.mustChangePassword) {
    return (
      <ChangePasswordScreen
        changePassword={useCases.changePassword}
        userName={loggedUser.name}
        onChanged={handleSignedIn}
        onSignOut={handleSignOut}
      />
    );
  }

  // E1-04: el protegido entra con documento y PIN.
  if (loggedUser.role === 'protegido') {
    return <ProtegidoHomeScreen userName={loggedUser.name} onSignOut={handleSignOut} />;
  }

  // E1-06: el administrador solo ve la gestión de colegios y personal.
  if (loggedUser.role === 'admin') {
    return selectedSchool ? (
      <SchoolStaffScreen
        manageStaff={useCases.manageStaff}
        school={selectedSchool}
        onBack={() => setSelectedSchool(null)}
      />
    ) : (
      <AdminSchoolsScreen
        manageSchools={useCases.manageSchools}
        userName={loggedUser.name}
        onOpenSchool={setSelectedSchool}
        onSignOut={handleSignOut}
      />
    );
  }

  // E1-03: el personal del colegio valida las matrículas pendientes.
  if (loggedUser.role === 'institucion') {
    return reviewedEnrollment ? (
      <EnrollmentReviewScreen
        validateEnrollment={useCases.validateEnrollment}
        protegidoId={reviewedEnrollment.id}
        onBack={() => setReviewedEnrollment(null)}
      />
    ) : (
      <PendingEnrollmentsScreen
        validateEnrollment={useCases.validateEnrollment}
        userName={loggedUser.name}
        onReview={setReviewedEnrollment}
        onSignOut={handleSignOut}
      />
    );
  }

  // E1-02: el acudiente ve sus menores y puede registrar uno nuevo.
  if (loggedUser.role === 'guardian') {
    // E3-01a, E3-02, E3-03: rutas del menor (W1) y editor de cada ruta (W2).
    if (routesProtegido && editedRoute) {
      return (
        <RouteEditorScreen
          manageRoutes={useCases.manageRoutes}
          protegidoId={routesProtegido.id}
          direction={editedRoute.direction}
          route={editedRoute.route}
          onSaved={() => setEditedRoute(null)}
          onBack={() => setEditedRoute(null)}
        />
      );
    }
    if (routesProtegido) {
      return (
        <RoutesScreen
          manageRoutes={useCases.manageRoutes}
          protegidoId={routesProtegido.id}
          protegidoName={routesProtegido.name}
          onEditRoute={(direction, route) => setEditedRoute({ direction, route })}
          onBack={() => setRoutesProtegido(null)}
        />
      );
    }
    if (pinProtegido) {
      return (
        <AssignPinScreen
          assignPin={useCases.assignPin}
          protegido={pinProtegido}
          onBack={() => setPinProtegido(null)}
        />
      );
    }
    return guardianRoute === 'registerProtegido' ? (
      <RegisterProtegidoScreen
        registerProtegido={useCases.registerProtegido}
        guardianId={loggedUser.id}
        pickPhoto={pickPhoto}
        onRegistered={() => setGuardianRoute('home')}
        onCancel={() => setGuardianRoute('home')}
      />
    ) : (
      <GuardianHomeScreen
        listMyProtegidos={useCases.listMyProtegidos}
        userName={loggedUser.name}
        onRegisterProtegido={() => setGuardianRoute('registerProtegido')}
        onAssignPin={setPinProtegido}
        onOpenRoutes={setRoutesProtegido}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hola, {loggedUser.name}</Text>
      <Text style={styles.message}>Sesión iniciada.</Text>
      <Pressable style={styles.button} onPress={handleSignOut} accessibilityRole="button">
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8, color: colors.text },
  message: { fontSize: 16, color: colors.textMuted, textAlign: 'center' },
  button: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
});
