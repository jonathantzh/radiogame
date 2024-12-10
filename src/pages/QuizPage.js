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
let [userProgress, setUserProgress] = useState(1);
let [userScore, setUserScore] = useState(0);
let [submitted, setSubmitted] = useState(false);
let [imageLoaded, setImageLoaded] = useState(false);

const [ csvIndex, setCsvIndex] = useState(["","00000001_000.png","Cardiomegaly"]);
const [anchorEl, setAnchorEl] = useState();

const { currentUser } = useContext(AuthContext); // Access the authenticated user
const userId = currentUser?.uid; // Extract the user ID from the auth context
const imagesBaseUrl = "https://radiogame.s3.ap-southeast-1.amazonaws.com/images/";

const loadCsvIndex = async function(){
    const response = await fetch( './Data_Entry_2017.csv' )
    const responseText = await response.text();
    let parseText = responseText.split('\n').slice(0,5000);
    setCsvIndex( parseText );
    setUserProgress(Math.round(Math.random()*parseText.length));
    setImageLoaded(true);
};

// Fetch the user's score from Firebase when the page loads
useEffect(() => {
    loadCsvIndex();

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
    "No Finding"
];

const handleOptionToggle = (option) => {
    setSelectedAnswers((prevSelected) =>
    prevSelected.includes(option)
        ? prevSelected.filter((item) => item !== option)
        : [...prevSelected, option]
    );
};


const handleSubmit = async () => {
    const selectBg = document.getElementById("quiz-bg");
    const actualAnswers = csvIndex[userProgress ? userProgress : 1].split(",")[1].split('|');
    let numCorrect = 0;
    let numWrong = 0;

    // set UI
    options.forEach(el => {
        document.getElementById(el).style.color = "grey";
    });
    actualAnswers.forEach(el => {
        document.getElementById(el.replace("Pleural_", "Pleural ")).style.fontWeight = "bolder";
        document.getElementById(el.replace("Pleural_", "Pleural ")).style.color = "black";
    });

    selectedAnswers.forEach(selectedAnswer => {
        if(actualAnswers.some(actualAnswer => {
            return actualAnswer === selectedAnswer.replace("Pleural ", "Pleural_");
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

    let deltaScore = numCorrect-numWrong;
    if(deltaScore < 0) { deltaScore = 0; }

    // update DB on new score
    const db = getDatabase();
    const userRef = ref(db, `users/${userId}`);

    onValue(userRef, (snapshot) => {
        const firebaseScore = snapshot.val().score || 0;
        let firebaseOptionsStats = Object.assign(snapshot.val().stats || {});

        // calculate new score and new stats
        const newScore = firebaseScore+deltaScore;
        setUserScore(newScore);
        
        options.forEach(option => {
            const userSelectedOption = selectedAnswers.some(el => el === option);
            const optionIsCorrect = actualAnswers.some(actualAnswer => {
                return actualAnswer === option.replace("Pleural ", "Pleural_");
            });
            firebaseOptionsStats[option] = Object.assign(firebaseOptionsStats[option]) || {tp:0,fp:0,tn:0,fn:0};

            // definitions: 
            
            // tp = user selected option, and option is correct
            if(userSelectedOption && optionIsCorrect) {
                firebaseOptionsStats[option].tp =  ++firebaseOptionsStats[option].tp;
            } 
            // fp = user selected option, and option is wrong
            else if (userSelectedOption && !optionIsCorrect){
                firebaseOptionsStats[option].fp =  ++firebaseOptionsStats[option].fp;
            } 
            // tn = user did not select option, and option is wrong
            else if (!userSelectedOption && !optionIsCorrect){
                firebaseOptionsStats[option].tn =  ++firebaseOptionsStats[option].tn;
            } 
            // fn = user did not select option, and option is correct
            else if (!userSelectedOption && optionIsCorrect){
                firebaseOptionsStats[option].fn =  ++firebaseOptionsStats[option].fn;
            }
            // console.log(option, userSelectedOption, optionIsCorrect, firebaseOptionsStats)
        });
        
        // Update the user's score and stats in Firebase
        // console.log('stats', firebaseOptionsStats)
        update(userRef, { score: newScore, stats: firebaseOptionsStats })
            .then(() => {
                console.log("Your answers have been submitted, and your score has been updated!");
                // setUserScore(newScore); // Update local score state
            })
            .catch((error) => {
                console.error("Error updating score:", error);
                console.log("There was an error updating your score. Please try again.");
            });
    }, { onlyOnce: true });

    setSubmitted(true);
};

const handleNext = () => {
    const selectBg = document.getElementById("quiz-bg");

    // reset UI
    selectBg.style.backgroundColor = "white";
    window.scrollTo(0, 0);
    setSelectedAnswers([]);

    setUserProgress(Math.round(Math.random()*csvIndex.length));

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
                        {imageLoaded ? <img
                        src={imagesBaseUrl + csvIndex[userProgress ? userProgress : 1].split(",")[0]}
                        alt="Chest X-ray"
                        style={{
                            minWidth: "300px", maxWidth: "30%",
                            height: "auto",
                            borderRadius: "8px",
                            border: "2px solid #ccc",
                        }}
                        onClick={handleClick}
                        /> : <Typography
                            variant="caption"
                            display="block"
                            textAlign="center"
                            sx={{ mt: 3, color: "gray" }}
                            >
                            Image Loading...
                        </Typography>}

                        {/* Question ID */}
                        <Typography
                            variant="caption"
                            display="block"
                            textAlign="center"
                            sx={{ mt: 3, color: "gray" }}
                            >
                            Question ID: {csvIndex[userProgress ? userProgress : 1].split(",")[0].split('.')[0]}
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
                    src={imagesBaseUrl + csvIndex[userProgress ? userProgress : 1].split(",")[0]}
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
