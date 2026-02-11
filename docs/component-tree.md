# Component Tree (MERN + React)

## Route map

- `/login`
- `/register`
- `/events`
- `/events/:eventId`
- `/dashboard/student`
- `/dashboard/organizer`
- `/dashboard/admin`
- `/checkin/:eventId`

## High-level tree

```txt
<App>
  <Providers>
    <AppRouter>
      <AuthLayout>
        <LoginPage />
        <RegisterPage />
      </AuthLayout>

      <ProtectedLayout>
        <Sidebar />
        <Navbar />
        <NotificationBell />

        <EventListPage>
          <SearchBar />
          <FilterChips />
          <EventCard />*
          <SkeletonLoader />
        </EventListPage>

        <EventDetailsPage>
          <EventHeader />
          <RegistrationPanel />
          <AnnouncementList />
          <RelatedEvents />
        </EventDetailsPage>

        <StudentDashboard>
          <ForYouFeed />
          <MyRegistrations />
          <ScheduleClashWarnings />
          <LeaderboardPreview />
        </StudentDashboard>

        <OrganizerDashboard>
          <OrganizerStatsCards />
          <EventForm />
          <AttendeeTable />
          <FeedbackSummaryChart />
        </OrganizerDashboard>

        <AdminDashboard>
          <CollegeAnalytics />
          <DepartmentParticipationChart />
          <UserRoleManager />
        </AdminDashboard>

        <CheckinPage>
          <QRScanner />
          <CheckinResultToast />
          <LiveAttendanceCounter />
        </CheckinPage>
      </ProtectedLayout>
    </AppRouter>
  </Providers>
</App>
```

## Custom hooks

- `useAuth()`
- `useEvents(filters)`
- `useRecommendations(userProfile)`
- `useRegistration(eventId)`
- `useClashDetection(eventId)`
- `useNotifications()`
- `useCheckin(eventId)`
- `useFeedback(eventId)`
