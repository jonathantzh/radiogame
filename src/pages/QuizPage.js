import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Popover from '@mui/material/Popover';

import {
    AppBar,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Container,
    FormControlLabel,
    Grid,
    IconButton,
    Toolbar,
    Typography,
  } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getDatabase, ref, onValue, update } from "firebase/database";
import { AuthContext } from "../contexts/AuthContext"; // Adjust path as needed

const QuizPage = () => {
const [selectedAnswers, setSelectedAnswers] = useState([]);
let [userProgress, setUserProgress] = useState(0);
const [anchorEl, setAnchorEl] = useState();
let [userScore, setUserScore] = useState(0);
let [submitted, setSubmitted] = useState(false);

const { currentUser } = useContext(AuthContext); // Access the authenticated user
const userId = currentUser?.uid; // Extract the user ID from the auth context

// Fetch the user's score from Firebase when the page loads
useEffect(() => {
    if (!userId) return; // Ensure userId is available
    const db = getDatabase();
    const scoreRef = ref(db, `users/${userId}/score`);

    onValue(scoreRef, (snapshot) => {
    const firebaseScore = snapshot.val();
    setUserScore(firebaseScore || 0); // Set score to 0 if not found
    });
}, [userId])

const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
};

const handlePopoverClose = () => {
    setAnchorEl(null);
};

const open = Boolean(anchorEl);
const id = open ? 'simple-popover' : undefined;

const navigate = useNavigate();

const questionList = [
    "https://storage.googleapis.com/kagglesdsdata/datasets/5839/18613/images_001/images/00000001_000.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=databundle-worker-v2%40kaggle-161607.iam.gserviceaccount.com%2F20241205%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20241205T115850Z&X-Goog-Expires=345600&X-Goog-SignedHeaders=host&X-Goog-Signature=8d7e7c7bba10b08202ac51a15ae521963002a1d6861c4cd92620c657b1c5f519e0d47c379dea461fee8caa3e37a1766d7766006fae6df5e3e21c892f6193f27122be70ef40a78129bedcc267aa10c04556abd026831d7c9b55ed9afdcfa803f8f41c4717f00695ee90359222db8ff2f766f6d1cfa07c18edfdd8c756bd156b8f8bc2952f262de8d6640de29b1889cbe63243d9ab892a39c3bb70fe7a4bd1ef85f184d00ad85a61c5c7c72e8d49f5b102c2dff6a434202fdafe1c06988c3d4f499af4a260386c6f77d45c35424b510761a0ecb65db0e82bc4cca358422208ca60b019fa1fc6f2b26c2c57c0b10bf093fc663ddceb85ed8f7cf3eb20994f338c95"
    ,"https://storage.googleapis.com/kagglesdsdata/datasets/5839/18613/images_001/images/00000001_001.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=databundle-worker-v2%40kaggle-161607.iam.gserviceaccount.com%2F20241205%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20241205T115850Z&X-Goog-Expires=345600&X-Goog-SignedHeaders=host&X-Goog-Signature=40be420588414e3ef7d5322052b8302e2b331da422773c966f8b071304af91528881a4727f2300c47c058084067d5581603dbe48f61867f09c6300d15f0bf674683f20e2a35153ae2cf71ac5578547d2c6563f0032f446465856de10677e21538a0b2046d877c4d6058e99effdb2f9032e515b73b872ac02dbc3ef149d1898cd47c053635909bd885962025475497347b9cceccf8f90a8b7e13e1f23b5fb9b46b88fa3748e99f4ed3d80e05bc43e872fea8c947a69f94697799bdd9df5bc2068290e0e0a8aaaaa3927ee8868d499d51b33a3442bd9f539a4ca13b78feb782606d9ff441128f229fdcda252109c210370c26529a7123b21ab927e2e1439ffe78f"
];
const answerList = [
    "Cardiomegaly",
    "Cardiomegaly|Emphysema"
];

const options = [
    "Atelectasis",
    "Cardiomegaly",
    "Effusion",
    "Infiltration",
    "Mass",
    "Nodule",
    "Pneumonia",
    "Pneumothorax",
    "Consolidation",
    "Edema",
    "Emphysema",
    "Fibrosis",
    "Pleural Thickening",
    "Hernia",
];

const timeout = async (delay) => {
    return new Promise( res => setTimeout(res, delay) );
    }

const handleOptionToggle = (option) => {
    setSelectedAnswers((prevSelected) =>
    prevSelected.includes(option)
        ? prevSelected.filter((item) => item !== option)
        : [...prevSelected, option]
    );
};


const handleSubmit = async () => {
    const selectBg = document.getElementById("quiz-bg");
    const actualAnswers = answerList[userProgress].split('|');
    let numCorrect = 0;
    let numWrong = 0;

    // set UI
    options.forEach(el => {
        document.getElementById(el).style.color = "grey";
    });
    actualAnswers.forEach(el => {
        document.getElementById(el.replace("_", " ")).style.fontWeight = "bolder";
        document.getElementById(el).style.color = "black";
    });

    selectedAnswers.forEach(selectedAnswer => {
        if(actualAnswers.some(actualAnswer => {
            return actualAnswer === selectedAnswer.replace(" ", "_");
        })) {
            numCorrect++;
        } else {
            numWrong++;
        }
    });

    if(numCorrect === actualAnswers.length && selectedAnswers.length === actualAnswers.length) {
        selectBg.style.backgroundColor = "#66FF99";
    } else if(numCorrect > 0) {
        selectBg.style.backgroundColor = "yellow";
    }
    else {
        selectBg.style.backgroundColor = "#FFCCCB";
    }

    // update DB on new score
    let deltaScore = numCorrect-numWrong;
    if(deltaScore < 0) { deltaScore = 0; }
    const newScore = userScore+deltaScore;
    setUserScore(newScore);

    const db = getDatabase();
    const userRef = ref(db, `users/${userId}`);

    // Update the user's score in Firebase
    update(userRef, { score: newScore })
      .then(() => {
        console.log("Your answers have been submitted, and your score has been updated!");
        // setUserScore(newScore); // Update local score state
      })
      .catch((error) => {
        console.error("Error updating score:", error);
        console.log("There was an error updating your score. Please try again.");
      });

      setSubmitted(true);
};

const handleNext = () => {
    const selectBg = document.getElementById("quiz-bg");

    // reset UI
    selectBg.style.backgroundColor = "white";
    window.scrollTo(0, 0);
    setSelectedAnswers([]);

    if(userProgress < questionList.length - 1) {
        userProgress++;
        setUserProgress(userProgress);
    }
    else setUserProgress(0);

    options.forEach(el => {
        document.getElementById(el).style.fontWeight = "normal";
        document.getElementById(el).style.color = "black";
    });

    setSubmitted(false);
    // navigate("/quiz"); // Navigate back to Dashboard fter submission
}

return (
    <Box>
    {/* Toolbar */}
        <AppBar position="static" sx={{ mb: 3 }}>
            <Toolbar>
            <IconButton
                edge="start"
                color="inherit"
                onClick={() => navigate("/")}
                aria-label="back"
            >
                <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Chest X-Ray Quiz
            </Typography>
            <Typography variant="body1" sx={{ ml: 2 }}>
                Score: {userScore}
            </Typography>
            </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ mt: 5 }}>
            <Card sx={{ boxShadow: 3 }} id="quiz-bg">
                <CardContent>
                    <Typography variant="h4" textAlign="center" gutterBottom>
                        Chest X-Ray Quiz
                    </Typography>
                    <Typography variant="body1" textAlign="center" gutterBottom>
                        Select the pathologies visible on the image below.
                    </Typography>

                    <Box sx={{ textAlign: "center", my: 3 }}>
                        <img
                        src={questionList[userProgress ? userProgress : 0]}
                        alt="Chest X-ray"
                        style={{
                            minWidth: "300px", maxWidth: "30%",
                            height: "auto",
                            borderRadius: "8px",
                            border: "2px solid #ccc",
                        }}
                        onClick={handleClick}
                        />

                        {/* Question ID */}
                        <Typography
                            variant="caption"
                            display="block"
                            textAlign="center"
                            sx={{ mt: 3, color: "gray" }}
                            >
                            Question ID: {questionList[userProgress].substring(questionList[userProgress].length - 36)}
                        </Typography>
                    </Box>

                    <Box component="fieldset" sx={{ border: "none" }}>
                        <Typography variant="h6" gutterBottom>
                        Select all that apply:
                        </Typography>
                        <Grid container spacing={2}>
                        {options.map((option) => (
                            <Grid item xs={12} sm={6} md={4} key={option}>
                            <FormControlLabel
                                control={
                                <Checkbox
                                    checked={selectedAnswers.includes(option)}
                                    onChange={() => handleOptionToggle(option)}
                                    color="primary"
                                    disabled={submitted}
                                />
                                }
                                label={<Typography id={option}>{option}</Typography>}
                            />
                            </Grid>
                        ))}
                        </Grid>
                    </Box>

                    <Box sx={{ textAlign: "center", mt: 4 }}>
                        <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={submitted ? handleNext : handleSubmit}
                        sx={{ px: 4, py: 1 }}
                        >
                        {submitted ? "Next" : "Submit"}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Container>

        <Popover
            id={id}
            open={open}
            anchorEl={anchorEl}
            onClose={handlePopoverClose}
            anchorOrigin={{
                vertical: "top",
                horizontal: "center",
            }}
            transformOrigin={{
                vertical: "center",
                horizontal: "center",
            }}
        >

            <Box
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handlePopoverClose}
                  sx={{ mt: 1, mb: 1 }}
                >
                  Close
                </Button>
                {/* <Typography variant="h6" gutterBottom>
                  Chest X-Ray (Zoomed In)
                </Typography> */}
                <img
                    src={questionList[userProgress ? userProgress : 0]}
                    alt="Chest X-ray Popover"
                    style={{
                        maxWidth: "100%",
                        height: "auto",
                        borderRadius: "8px",
                    }}
                />
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handlePopoverClose}
                  sx={{ mt: 2 }}
                >
                  Close
                </Button>
              </Box>
        </Popover>
    </Box>
);
};

export default QuizPage;
