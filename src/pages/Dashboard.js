import React, { useEffect, useState, useContext } from "react";
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Toolbar,
  Typography,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import QuizIcon from "@mui/icons-material/Quiz";
import { getDatabase, ref, onValue } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

const DashboardPage = () => {
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const userId = currentUser?.uid;
  const userEmail = currentUser?.email;

  // Fetch user's score
  useEffect(() => {
    if (!userId) return;

    const db = getDatabase();
    const scoreRef = ref(db, `users/${userId}/score`);

    onValue(scoreRef, (snapshot) => {
      const firebaseScore = snapshot.val();
      setScore(firebaseScore || 0);
    });
  }, [userId]);

  // Fetch leaderboard data
  useEffect(() => {
    const db = getDatabase();
    const usersRef = ref(db, "users");

    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const scores = Object.entries(data).map(([id, userData]) => ({
          id,
          email: userData.email || "Anonymous",
          nickname: userData.nickname || "Unknown",
          score: userData.score || 0,
        }));
        // Sort by score descending
        scores.sort((a, b) => b.score - a.score);
        setLeaderboard(scores);
      }
    });
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleStartQuiz = () => {
    navigate("/quiz");
  };

  return (
    <Box>
      {/* App Bar */}
      <AppBar position="static" sx={{ mb: 3 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            RadioGame Dashboard
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="center">
          {/* User Info */}
          <Grid item xs={12} md={4}>
            <Card sx={{ boxShadow: 3, textAlign: "center", p: 2 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: "auto",
                  mb: 2,
                  bgcolor: "primary.main",
                }}
              >
                {userEmail?.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h5" gutterBottom>
                Welcome, {userEmail}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                User ID: {userId}
              </Typography>
              <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                Your Score: {score}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<QuizIcon />}
                fullWidth
                sx={{ mt: 2 }}
                onClick={handleStartQuiz}
              >
                Start Quiz
              </Button>
            </Card>
          </Grid>

          {/* Leaderboard */}
          <Grid item xs={12} md={8}>
            <Card sx={{ boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Leaderboard
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Rank</TableCell>
                        <TableCell>Nickname</TableCell>
                        {/* <TableCell>Email</TableCell> */}
                        <TableCell align="right">Score</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leaderboard.map((user, index) => (
                        <TableRow
                          key={user.id}
                          sx={{
                            backgroundColor:
                              user.id === userId ? "rgba(0, 0, 255, 0.1)" : "inherit",
                          }}
                        >
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            {user.nickname}
                            <Typography
                              variant="caption"
                              sx={{ mt: 3, color: "gray" }}
                            >{' (ID: ' + user.id.substring(user.id.length - 5) + ')'}
                            </Typography>
                          </TableCell>
                          {/* <TableCell>{user.email}</TableCell> */}
                          <TableCell align="right">{user.score}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default DashboardPage;
