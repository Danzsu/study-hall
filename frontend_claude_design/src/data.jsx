/* Shared data for all screens */
const SUBJECTS = [
  { id:"ml", name:"Machine Learning", desc:"Supervised, unsupervised & deep learning",
    color:window.C.accent, questions:150, lessons:8, done:87, quizzesTaken:12, avgScore:74, streak:5,
    sections:[
      { id:"s1", name:"ML Framing", q:30, done:30 },
      { id:"s2", name:"Data Prep",  q:35, done:28 },
      { id:"s3", name:"Evaluation", q:40, done:22 },
      { id:"s4", name:"Supervised", q:28, done:7 },
      { id:"s5", name:"Deep Learning", q:17, done:0 },
    ] },
  { id:"stats", name:"Statistics", desc:"Probability, distributions & inference",
    color:window.C.blue, questions:120, lessons:6, done:43, quizzesTaken:6, avgScore:81, streak:2,
    sections:[
      { id:"s1", name:"Probability",   q:30, done:30 },
      { id:"s2", name:"Distributions", q:35, done:13 },
      { id:"s3", name:"Inference",     q:30, done:0 },
      { id:"s4", name:"Regression",    q:25, done:0 },
    ] },
  { id:"algo", name:"Algorithms", desc:"Data structures & complexity analysis",
    color:window.C.green, questions:180, lessons:10, done:12, quizzesTaken:2, avgScore:62, streak:0,
    sections:[
      { id:"s1", name:"Sorting", q:30, done:12 },
      { id:"s2", name:"Graph Theory", q:40, done:0 },
      { id:"s3", name:"Dynamic Prog.", q:35, done:0 },
      { id:"s4", name:"Complexity", q:40, done:0 },
      { id:"s5", name:"Data Structs", q:35, done:0 },
    ] },
];

// Lessons for the Study page (sidebar) -- shared across subjects (we vary the current lesson based on subject)
const ML_CURRICULUM = [
  { section:"Foundations", lessons:[
    { id:1, title:"What is Machine Learning?", done:true, time:"8 min" },
    { id:2, title:"The ML Workflow", done:true, time:"10 min" },
    { id:3, title:"Training, Validation & Test Sets", done:false, active:true, time:"12 min" },
    { id:4, title:"Bias vs. Variance Tradeoff", done:false, time:"15 min" },
  ]},
  { section:"Supervised Learning", lessons:[
    { id:5, title:"Linear Regression", done:false, time:"14 min" },
    { id:6, title:"Logistic Regression", done:false, time:"12 min" },
    { id:7, title:"Decision Trees", done:false, time:"18 min" },
  ]},
  { section:"Model Evaluation", lessons:[
    { id:8, title:"Confusion Matrix & Metrics", done:false, time:"11 min" },
    { id:9, title:"Cross-Validation", done:false, time:"9 min" },
  ]},
];

// Quiz questions (reused from exam bank)
const QUIZ_QUESTIONS = [
  { id:"q1", section:"ML Framing", type:"mc",
    q:"Which of the following best describes overfitting?",
    options:["Model performs poorly on both train and test data","Model performs well on train data but poorly on unseen data","Model performs well on test data but poorly on train data","Model has high bias and low variance"],
    correct:1,
    explain:"Overfitting means the model memorises the training set including noise, so it fails to generalise to new data."
  },
  { id:"q2", section:"Data Prep", type:"mc",
    q:"PCA is primarily used for:",
    options:["Increasing the number of features","Dimensionality reduction via variance maximisation","Normalising feature scales","Handling missing values"],
    correct:1,
    explain:"PCA finds new axes (principal components) that maximise variance, reducing dimensionality while preserving information."
  },
  { id:"q3", section:"Evaluation", type:"mc",
    q:"Which metric is most appropriate when false negatives are very costly?",
    options:["Precision","Accuracy","Recall","F1 Score"],
    correct:2,
    explain:"Recall = TP/(TP+FN). Missing positives is exactly what recall measures."
  },
  { id:"q4", section:"Evaluation", type:"tf",
    q:"The ROC curve plots True Positive Rate against False Positive Rate.",
    correct:true,
    explain:"Yes — TPR on the y-axis and FPR on the x-axis, over a range of decision thresholds."
  },
  { id:"q5", section:"Data Prep", type:"tf",
    q:"The test set should be used to tune model hyperparameters.",
    correct:false,
    explain:"No — use the validation set for tuning. The test set is only for final evaluation."
  },
];

const WRITTEN_QUESTIONS = [
  { id:"w1", section:"ML Framing",
    q:"Explain the bias-variance tradeoff in your own words. Why does it matter when selecting a model?",
    keywords:["bias","variance","overfitting","underfitting","complexity","generalise"],
    ideal:"High bias means the model is too simple and underfits — it misses real patterns in the data. High variance means the model is too complex and overfits — it memorises noise. The tradeoff is to pick a complexity level that minimises total expected error: Bias² + Variance + irreducible noise. This matters because you want a model that generalises well to unseen data, not just one that performs well on the training set." },
  { id:"w2", section:"Evaluation",
    q:"A medical diagnostic model achieves 99% accuracy but only 30% recall on positive cases. Is this a good model? Explain your reasoning.",
    keywords:["class imbalance","recall","false negative","positive","accuracy","misleading"],
    ideal:"No. The high accuracy is misleading because it likely results from class imbalance — roughly 99% of cases are negative, so predicting 'negative' always gets 99% accuracy. With only 30% recall, the model misses 70% of actual positive cases (false negatives), which is catastrophic in a medical setting where a missed diagnosis can have serious consequences. Recall should be the primary metric here, not accuracy." },
];

const FLASHCARDS = [
  { id:"f1", front:"Overfitting", back:"When a model learns the training data including its noise and fails to generalise to new data. Signals: low training error, high validation error." },
  { id:"f2", front:"Regularisation", back:"Techniques (L1, L2, dropout, early stopping) that constrain a model's complexity to improve generalisation by adding a penalty or stopping training early." },
  { id:"f3", front:"Cross-validation", back:"A technique that splits the data into k folds, trains k models rotating which fold is held out, then averages the scores for a more reliable estimate of performance." },
  { id:"f4", front:"Precision vs. Recall", back:"Precision = TP/(TP+FP) — of those you called positive, how many were? Recall = TP/(TP+FN) — of the real positives, how many did you catch?" },
  { id:"f5", front:"Gradient Descent", back:"An optimisation algorithm that iteratively updates parameters in the direction opposite to the gradient of the loss, stepping by a learning rate." },
  { id:"f6", front:"Vanishing Gradients", back:"When gradients become very small during backprop in deep networks, slowing or halting learning. Addressed by ReLU activations, residual connections and LSTMs." },
];

const GLOSSARY = [
  { term:"Activation Function", abbr:"σ", def:"A non-linear function applied to a neuron's weighted input. Common: ReLU, sigmoid, tanh.", section:"Deep Learning" },
  { term:"Batch Normalisation", abbr:"BN", def:"Normalises layer inputs per mini-batch. Stabilises and accelerates training.", section:"Deep Learning" },
  { term:"Confusion Matrix", abbr:"CM", def:"Table comparing predicted vs actual classes. Gives TP, FP, TN, FN.", section:"Evaluation" },
  { term:"Cross-Entropy Loss", abbr:"CE", def:"Loss for classification: −Σ y·log(p). Lower is better.", section:"Supervised" },
  { term:"Dimensionality Reduction", abbr:"", def:"Projecting high-dim data to a lower-dim space that preserves structure. PCA, t-SNE, UMAP.", section:"Data Prep" },
  { term:"Ensemble Learning", abbr:"", def:"Combining multiple models (bagging, boosting, stacking) for better performance.", section:"Supervised" },
  { term:"F1 Score", abbr:"F1", def:"Harmonic mean of precision and recall. Good for imbalanced classes.", section:"Evaluation" },
  { term:"Gradient Descent", abbr:"GD", def:"Iterative optimisation: θ ← θ − η·∇L(θ).", section:"Supervised" },
  { term:"Hyperparameter", abbr:"", def:"Config set before training (learning rate, depth). Not learned from data.", section:"ML Framing" },
  { term:"k-Fold Cross-Validation", abbr:"k-CV", def:"Rotate k folds as validation set, average scores.", section:"Evaluation" },
  { term:"Overfitting", abbr:"", def:"Model memorises training data, fails on new data. High variance.", section:"ML Framing" },
  { term:"Principal Component Analysis", abbr:"PCA", def:"Orthogonal transform to axes of maximum variance.", section:"Data Prep" },
  { term:"Regularisation", abbr:"", def:"Constraints (L1, L2, dropout) that reduce overfitting.", section:"ML Framing" },
  { term:"Support Vector Machine", abbr:"SVM", def:"Classifier finding the hyperplane with max margin between classes.", section:"Supervised" },
];

const WRONG_ANSWERS = [
  { qid:"mc1", subject:"ml", section:"ML Framing", q:"Which metric is most appropriate when false negatives are very costly?",
    yourAnswer:"Precision", correctAnswer:"Recall",
    explain:"Recall = TP/(TP+FN). When missing positives is expensive (medical screening, fraud), recall is what you want.",
    when:"2d ago", attempts:2 },
  { qid:"mc2", subject:"ml", section:"Data Prep", q:"PCA is primarily used for:",
    yourAnswer:"Normalising feature scales", correctAnswer:"Dimensionality reduction via variance maximisation",
    explain:"PCA projects data onto new axes (principal components) that maximise variance, reducing dimensionality while preserving information.",
    when:"2d ago", attempts:1 },
  { qid:"mc3", subject:"stats", section:"Inference", q:"A p-value of 0.03 means:",
    yourAnswer:"There is a 97% probability the alternative hypothesis is true", correctAnswer:"The observed data is unlikely assuming H₀",
    explain:"P-values are conditional on H₀ — they don't tell you the probability of the hypothesis itself.",
    when:"5d ago", attempts:3 },
  { qid:"mc4", subject:"ml", section:"Deep Learning", q:"LSTMs were designed to solve:",
    yourAnswer:"Overfitting in feedforward networks", correctAnswer:"The vanishing gradient problem in RNNs",
    explain:"LSTMs use gating mechanisms to preserve gradients over long sequences.",
    when:"1w ago", attempts:1 },
];

const RECENT_SESSIONS = [
  { type:"Quiz", subject:"Machine Learning", score:8, total:10, time:"2h ago", color:window.C.accent },
  { type:"Written Test", subject:"Statistics", score:7, total:10, time:"Yesterday", color:window.C.blue },
  { type:"Flashcards", subject:"Machine Learning", score:14, total:18, time:"Yesterday", color:window.C.purple },
  { type:"Quiz", subject:"Algorithms", score:5, total:10, time:"2 days ago", color:window.C.green },
];

Object.assign(window, { SUBJECTS, ML_CURRICULUM, QUIZ_QUESTIONS, WRITTEN_QUESTIONS, FLASHCARDS, GLOSSARY, WRONG_ANSWERS, RECENT_SESSIONS });
