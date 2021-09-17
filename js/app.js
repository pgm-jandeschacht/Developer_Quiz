// Import modules
import * as PM from './parameters.js';
import * as LS from './localStorage.js';
import * as HI from './history.js';
import * as HE from './helper.js';

const app = {

  init() {
    this.cacheElements();
    this.registerListeners();
    this.createHTMLForCategories();

    this.currentCat = 'All';
    this.currentDif = 'Easy';
    this.currentAmount = 5;
    this.questionNumber = 0;
    this.counter = null;
    this.activeQuestionId = null;
    this.chosenAnswer = '';
    this.answerArray = [];
    this.chosenAnswers = [];
    this.$questionsAnswered = [];
  },

  // Cache elements
  cacheElements() {
    this.$categories = document.querySelector('.categories');
    this.$difficulties = document.querySelector('.difficulties');
    this.$amount = document.querySelector('#amount');
    this.$slider = document.querySelector('.slider__value');
    this.$start = document.querySelector('.start__button');
    this.$setup = document.querySelector('.setup');
    this.$questions = document.querySelector('.questions');
    this.$quiz = document.querySelector('.quiz');
    this.$result = document.querySelector('.result');
    this.$yourResult = document.querySelector('.result__container');
    this.$timer = document.querySelector('.timer__container')
  },

  // Register listeners
   async registerListeners() {
    // Clicked on category
    this.$categories.addEventListener('click', (e) => {
      e.preventDefault();
      this.currentCat = e.target.dataset.category;
    });
    
    // Clicked on difficulty
    this.$difficulties.addEventListener('click', (e) => {
      e.preventDefault();
      this.currentDif = e.target.dataset.difficulty;
    });
    
    // Used the slider
    this.$amount.addEventListener('input', (e) => {
      this.currentAmount = e.target.value;
      this.createSliderValue();
    });
      
    // Clicked start
    this.$start.addEventListener('click', (e) => {
      e.preventDefault();
      this.fetchQuizAPI();
      this.questions = LS.getArrayFromLocalStorage('questions');
      this.$setup.classList.add('hide');
      this.$quiz.classList.remove('hide');
      HI.add(null, null, null);
    });

    // Clicked the back button in the browser
    window.addEventListener('popstate', (e) => {
      this.$quiz.classList.add('hide');
      this.$result.classList.add('hide');
      this.$setup.classList.remove('hide');
      LS.clearStorage();
      window.history.go(0);
    });

    // Clicked 'Take another quiz'
    document.querySelector('.other__quiz').addEventListener('click', (e) => {
      e.preventDefault();
      this.$result.classList.add('hide');
      this.$setup.classList.remove('hide');
      LS.clearStorage();
      window.history.go(-1);
    });

    // Clear the storage
    LS.clearStorage();
  },

  // Inject categories
  createHTMLForCategories() {
    PM.categories.map((cat) => {
      const categoriesList = document.createElement("li");
      categoriesList.innerHTML = `<a data-category="${cat}" href="" class="btn">${cat}</a>`;
      this.$categories.appendChild(categoriesList);
    }).join('');
    
    this.setActiveCategory();
  },

  // Set the active category
  setActiveCategory() {
    let first = this.$categories.childNodes[0].childNodes[0];
    first.classList.add('active');

    // Toggle class for selected button
    let btns = document.querySelectorAll('.btn');
    Array.from(btns).forEach(item => {
      item.addEventListener('click', () => {
        let selected = document.querySelectorAll('.active');
        selected[0].className = selected[0].classList.toggle('active');
        item.classList.add('active');
      });
    });

    this.createHTMLForDifficulties();
  },
  
  // Inject difficulties
  createHTMLForDifficulties() {
    PM.difficulties.map((dif) => {
      const difficultiesList = document.createElement('li');
      difficultiesList.innerHTML = `<a data-difficulty="${dif}" href="" class="btn-big">${dif}</a>`;
      this.$difficulties.appendChild(difficultiesList)
    }).join('');
    
    this.setActiveDifficulty(); 
  },
  
  // Set the active difficulty
  setActiveDifficulty() {
    let first = this.$difficulties.childNodes[0].childNodes[0];
    first.classList.add('active-big');
    
    // Toggle class for selected button
    let btns = document.querySelectorAll(".btn-big");
    Array.from(btns).forEach(item => {
      item.addEventListener("click", () => {
         let selected = document.querySelectorAll(".active-big");
         selected[0].className = selected[0].classList.toggle("active-big");
         item.classList.add('active-big');
      });
   });
  
   this.createSliderValue();
  },

  // Inject visible value for slider
  createSliderValue() {
    this.$slider.innerHTML = (this.currentAmount == 1 ? `${this.$amount.value} Question` : `${this.$amount.value} Questions`);
  },

  // Fetch Api and save in local storage
  async fetchQuizAPI() {
    const response = await fetch(`${PM.API_URL}apiKey=${PM.API_KEY}${(this.currentCat === 'All' ? '' : `&category=${this.currentCat}`)}&difficulty=${this.currentDif}&limit=${this.currentAmount}`);
    const data = await response.json();

    LS.saveArrayInLocalStorage('questions', data);
    this.questions = LS.getArrayFromLocalStorage('questions');

    this.buildQuiz();
  },

  // Build the quiz ui
  buildQuiz() {
    // Build question
    const getQuestion = () => {
      this.$questions.innerHTML = `<h3 class="question__quiz"><span class="question__counter"><span id="counter">${this.questionNumber + 1}</span> / ${this.questions.length}</span>${this.questions[this.questionNumber].question}</h3>`;
                                
      this.$questions.innerHTML += `<p>${(this.questions[this.questionNumber].multiple_correct_answers === 'true' ? 'Multiple answers possible' : '')}</p>`

      const answers = Object.entries(this.questions[this.questionNumber].answers).map(ans => {
        if (ans[1] != null) {
          return `<button class="question__answer" value="${ans[0]}" data-key="${ans[0]}" >${HE.replace(ans[1])}</button>`
        }
      }).join('');
      
      this.$questions.innerHTML += `<div class="answers__list" >${answers}</div>`;
      
      // Cal functions
      getAnswer();
      timer();
    }

    // Build timer function
    const timer = () => {
      let time = 15;

      this.$timer.innerHTML = `<progress class="timer" value="${time}" max="15"></progress>`;
      this.timeValue = setInterval((interval) => {
        time--;
        this.$timer.innerHTML = `<progress class="timer" value="${time}" max="15"></progress>`;
        // if timer is 0 then...
        if (time <= 0) {

          clearInterval(this.timeValue);
          this.answerArray.push('false');

          // if question number is smaller then number of questions then...
          if ((this.questionNumber + 1) < this.questions.length) {
            pushAnswer();
            LS.saveArrayInLocalStorage('answered', this.answerArray);
            LS.saveArrayInLocalStorage('yourAnswers', this.$questionsAnswered);
            this.questionNumber++;
            getQuestion();
            
          } else {
            // If there are no more questions then got to this.result()
            pushAnswer();
            LS.saveArrayInLocalStorage('answered', this.answerArray);
            LS.saveArrayInLocalStorage('yourAnswers', this.$questionsAnswered);
            this.result();
          }
        }
      }, 1000);
    }
    

    // Get chosen answer and put it in an array
    const getAnswer = () => {
      this.chosenAnswer = '';
      const buttons = document.querySelectorAll('.question__answer');
      buttons.forEach((button) => button.addEventListener('click', (e) => {
        e.preventDefault();
        this.chosenAnswer = button.value;
      }));
    };

    const pushAnswer = () => {
      // Push to array
      if (this.chosenAnswer !== '') {
        this.chosenAnswers.push(this.chosenAnswer);
      } else {
        this.chosenAnswers.push('noAnswer')
      }

      // Check what answer is correct
      const answerCheck = Object.entries(this.questions[this.questionNumber].correct_answers).map(correct => {
        if (correct[1] === 'true') {
          return correct[0];
        }
      });

      // Check if it is undefined
      this.checking = [];
      for (let i = 0; i <= (answerCheck.length - 1); i++) {
        if (answerCheck[i] != undefined) {
          this.checking.push(answerCheck[i]);
        }
      };
      
      // Check if this.chosenAnswer is empty or not
      let chosenAnswer = '';
      if (this.chosenAnswer !== '') {
        chosenAnswer = this.chosenAnswer;
      } else {
        chosenAnswer = 'noAnswer';
      };

      // Put data in object and push in array
      this.$questionsAnswered.push({question: this.questions[this.questionNumber].question, 
                                    correct_answers: this.checking,
                                    your_answer: chosenAnswer,
                                    all_answers: this.questions[this.questionNumber].answers,
                                    your_answer__correct: (chosenAnswer + '_correct')});
    }

    // Check the answer if it is correct or not and put that value in array
    const checkAnswer = () => {

      // Match answer with true or false value
      const answers = Object.entries(this.questions[this.questionNumber].correct_answers).map(correct => {
        if (this.chosenAnswer !== 'noAnswer' && (this.chosenAnswer + '_correct') === correct[0]) {
          return correct[1];
        }
      });

      // Check if it is not undefined
      this.check = '';
      for (let i = 0; i <= (answers.length - 1); i++) {
        if (answers[i] != undefined) {
          this.check = answers[i];
        }
      };
      // Push to array
      this.answerArray.push(this.check);
    }

    // Call the function
    getQuestion();

    // Stop the quiz and go directly to results
    document.querySelector('.stop').addEventListener('click', (e) => {
      e.preventDefault();
      this.result();
    })

    // User clicks 'Next question' button and goes to next question
    const nextQuestion = () => {
      document.querySelector('.next').addEventListener('click', (e) => {
        // if question number is smaller then number of questions then...
        if ((this.questionNumber + 1) < this.questions.length) {
          clearInterval(this.timeValue);
          pushAnswer();
          checkAnswer();
          LS.saveArrayInLocalStorage('answered', this.answerArray);
          LS.saveArrayInLocalStorage('yourAnswers', this.$questionsAnswered);
          this.questionNumber++;
          this.chosenAnswer = '';
          getQuestion();

        // If there are no more questions then got to this.result()
        } else if ((this.questionNumber+ 1) == this.questions.length) {
          clearInterval(this.timeValue);
          pushAnswer();
          checkAnswer();
          LS.saveArrayInLocalStorage('answered', this.answerArray);
          LS.saveArrayInLocalStorage('yourAnswers', this.$questionsAnswered);
          this.result();
        }        
      });
    }
    // Call the function
    nextQuestion();
  },

  result() {
    // Make results visible
    this.$quiz.classList.add('hide');
    this.$result.classList.remove('hide');

    // Get the array from local storage
    const answeredQuestions = LS.getArrayFromLocalStorage('answered');
    
    // Check if answer is true
    this.checking = [];
    for (let j = 0; j <= (answeredQuestions.length - 1); j++) {
      if (answeredQuestions[j] === 'true') {
        this.checking.push(answeredQuestions[j]);
      }
    };
    
    // Show score
    this.$yourResult.innerHTML = `<p class="score">Score: ${this.checking.length}/${answeredQuestions.length}</p>`;
    
    // Create element
    const resultAnswers = document.createElement('h2');
    resultAnswers.innerHTML = 'Your answers';
    this.$yourResult.appendChild(resultAnswers);
    
    // Create element
    const overviewContainer = document.createElement('div')
    overviewContainer.className = 'overview';
    this.$yourResult.appendChild(overviewContainer)
    
    // Cache
    let $overview = document.querySelector('.overview');
    
    
    // Get the array from local storage
    const overviewAnswers = LS.getArrayFromLocalStorage('yourAnswers');

    // Add class according to the answer of the user
    const overviewAnswer = overviewAnswers.map((te, index) => {
      const checking = te.correct_answers.join('');

      // Check answers
      const checkingAnswers = Object.entries(te.all_answers).map(ans => {
        if (ans[1] != null) {
          if ((ans[0] + '_correct') == checking && te.your_answer__correct != checking) {
            return `<p class="green">${HE.replace(ans[1])} <span class="right">(right answer)</span></p>`
          } else if (te.your_answer == ans[0] && te.your_answer__correct != checking) {
            return `<p class="red">${HE.replace(ans[1])}</p>`
          } else if (te.your_answer == ans[0] && te.your_answer__correct == checking && (ans[0] + '_correct') == checking) {
            return `<p class="green__right">${HE.replace(ans[1])}</p>`
          } else {
            return `<p class="others">${HE.replace(ans[1])}</p>`
          }
        }
      }).join('');

      return `
              <div class="overview__container ${(te.your_answer__correct === checking ? 'green' : 'red')}">
                <div class="overview__question__flex">
                  <h3><span class="question__number">${index + 1}.</span>${HE.replace(te.question)} <span>${(te.your_answer === 'noAnswer' ? '(No answer)' : '')}</span></h3>
                  <p class="${(te.your_answer__correct === checking ? 'green' : 'red')}">${(te.your_answer__correct === checking ? '+1' : '0')}</p>
                </div>
                <div class="overview__answers">
                  ${checkingAnswers}
                </div>
              </div>
              `;
    }).join('');

    $overview.innerHTML = overviewAnswer;    
  },
};

app.init();