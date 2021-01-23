'use strict';

const mealsEl = document.getElementById('meals');
const favoriteContainer = document.getElementById('fav-meals')

const mealPopup = document.getElementById('meal-popup');
const mealInfoEl = document.getElementById('meal-info')
const popupCloseBtn = document.getElementById('close-popup');

const searchTerm = document.getElementById('search-term');
const searchBtn = document.getElementById('search');

getRandomMeal();
fetchFavMeals();

async function getRandomMeal(){
  const resp = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
  const respData = await resp.json(); // resp도 하나의 promise object가 되는거임. 그니까 이것도 await해야 동기적인 것처럼 쓸 수 있는 것.
  const randomMeal = respData.meals[0]

  console.log(randomMeal);

  addMeal(randomMeal, true);
}
// 이게 뭐랑 같냐면

// function getRandomMeal(){
//   let randomMeal = undefined;
//   return fetch('https://www.themealdb.com/api/json/v1/1/random.php')
//   .then(response => response.json())
//   .then(respData => respData.meals[0])
//   .then((randomMeal) => {
//     console.log(randomMeal);
//     return randomMeal;
//   })
//   .then(randomMeal => addMeal(randomMeal, true));
// }

// 이런 형태의 Promise chaining을 async await로 동기적인 것처럼 표현해놓은 것. 

async function getMealById(id){
  const resp = await fetch('https://www.themealdb.com/api/json/v1/1/lookup.php?i='+id);
  const respData = await resp.json();
  const meal = respData.meals[0];

  return meal;
}

async function getMealsBySearch(term){
  const resp =  await fetch('https://www.themealdb.com/api/json/v1/1/search.php?s='+term);

  const respData = await resp.json();
  const meals = respData.meals;

  console.log(meals);

  return meals;
}

// 기본값이 false인 random이라는 인자를 전달받는다는 뜻.
function addMeal(mealData, random = false){
  const meal = document.createElement('div');
  meal.classList.add('meal')

  meal.innerHTML = `
    <div class="meal-header">
      ${random ? '<span class="random"> Random Recipe </span>' : ''}
      
      <img
        src="${mealData.strMealThumb}"
        alt="${mealData.strMeal}"
      />
    </div>
    <div class="meal-body">
      <h4>${mealData.strMeal}</h4>
      <button class="fav-btn">
        <i class="fas fa-heart"></i>
      </button>
    </div>
  `;

  const btn = meal.querySelector('.meal-body .fav-btn');
  btn.addEventListener('click', () => {
    if (btn.classList.contains('active')) {
      removeMealLS(mealData.idMeal)
      btn.classList.remove('active');
    } else {
      addMealLS(mealData.idMeal)
      btn.classList.add('active');
    }

    fetchFavMeals();
  });

  meal.addEventListener('click', () => {
    showMealInfo(mealData);
  });

  mealsEl.appendChild(meal);
}

function addMealLS(mealId){
  const mealIds = getMealsLS();

  // storage.setItem(keyName, keyValue);
  localStorage.setItem('mealIds', JSON.stringify([...mealIds, mealId])); // '...' 이거는 array에 들어있는 item 하나하나씩을 각각 낱개로 가져와서 복사해 온다는 것을 말함.
}

function removeMealLS(mealId){
  const mealIds = getMealsLS();

  localStorage.setItem('mealIds', JSON.stringify(mealIds.filter(id => id !== mealId)));
}

function getMealsLS(){
  const mealIds = JSON.parse(localStorage.getItem('mealIds'));

  return mealIds === null ? [] : mealIds;
}

async function fetchFavMeals(){
  // clean the container
  favoriteContainer.innerHTML = '';

  const mealIds = getMealsLS();

  for (let i = 0; i < mealIds.length; i++) {
    const mealId = mealIds[i];
    const meal = await getMealById(mealId);

    // add them to the Favorite Meals
    addMealFav(meal);
  }
}

function addMealFav(mealData){
  const favMeal = document.createElement('li');

  favMeal.innerHTML = `
    <img
      src="${mealData.strMealThumb}"
      alt="${mealData.strMeal}"
    />
    <span>${mealData.strMeal}</span>
    <button class="clear">
      <i class="fas fa-window-close"></i>
    </button>
  `;

  const btn = favMeal.querySelector('.clear');
  btn.addEventListener('click', () => {
    removeMealLS(mealData.idMeal);

    fetchFavMeals();
  });

  favMeal.addEventListener('click', () => {
    showMealInfo(mealData);
  });

  favoriteContainer.appendChild(favMeal);
}

function showMealInfo(mealData){
  // clean it up
  mealInfoEl.innerHTML = '';

  // update the Meal info
  const mealEl = document.createElement('div');

  // get ingredients and measures
  const ingredients = [];

  for (let i = 1; i <= 20; i++) {
    /**
     * object.key vs object['key'](or object[key])
     * 
     * Object의 property를 접근 하는 방법에는 []와 . 을 사용하는 방법이 있습니다.
     * object인 a는 property로 2를 가집니다. 2에 대한 접근은 a[‘2’]로는 가능하지만 a.2는 에러가 발생합니다. 
     * 마찬가지로 a[‘2a’]는 가능하지만 a.2a는 에러가 발생합니다.
     * [] 으로 접근할때는 객체에 속성값이 문자열이라면 전부 접근가능합니다.
     * 
     * 제일 큰 차이는 "property를 변수로 접근 가능하느냐" 입니다.
     * 
     * var a = {
     *  b : 1,
     *  c : 2
     * }
     * var b = ‘c’
     * console.log(a[b] + ‘ vs ‘ + a.b) // 2 vs 1
     * 
     * console.log 에서 a[b]와 a.b로 접근 했습니다. 
     * 헌데 b는 변수로 c라는 값을 가지고 있습니다. 
     * a[b]에서는 b가 변수가 되어 실제로 객체 a의 속성 c의 값인 2를 출력하는 반면, 
     * a.b에서는 b가 변수가 아닌 실제 속성 b에 접근하여 1을 출력하게 됩니다.
     */
    if (mealData['strIngredient' + i]) {
      ingredients.push(`${mealData['strIngredient' + i]} - ${mealData['strMeasure' + i]}`)
    } else {
      break;
    }
  }

  mealEl.innerHTML = `
    <h1>${mealData.strMeal}</h1>
    <img
      src="${mealData.strMealThumb}"
      alt="${mealData.strMeal}"
    />
    <p>
      ${mealData.strInstructions}
    </p>
    <h3>Ingredients:</h3>
    <ul>
      ${ingredients.map(ing => `<li>${ing}</li>`).join('')}
    </ul> 
  `;

  mealInfoEl.appendChild(mealEl);

  // show the popup
  mealPopup.classList.remove('hidden');
}

searchBtn.addEventListener('click', async () => {
  // clear container
  // 검색 버튼을 클릭하는 순간 이전에 검색하거나, random meal로 나온 것들을 innerHTML로 넣은 HTMLString들을 모두 지우려는 것 
  mealsEl.innerHTML = '';

  const search = searchTerm.value;

  const meals = await getMealsBySearch(search);
  // 만약 promise인 애들을 await 처리하지 않고 그냥 return값을 할당해버리면, 콘솔창에 찍었을 때
  // Promise {<pending>} 이라고 뜸. 즉, 아직 pending중인 promise값이라는 거지. 
  // await를 넣어야 pending이 끝나고 처리된 결과값을 넣어주는 거임.
  // await은 promise에 해당하는 line을 promise가 끝날때까지 '기다리게' 해주는 역할임.
  // 그니까 만일 콘솔에 Promise가 뜬다! 이거는 해당 line이 promise가 필요한 무거운 작업이라는 뜻이니 await을 달아주라는 뜻.

  // 항상 무거운 작업을 포함하고 있는, async를 달고 있는 함수를 콜백함수에서 호출할때는
  // 콜백함수도 async를 붙이고, 내부에서 호출하는 함수도 await를 붙여서 호출해야 함.

  if (meals) {
    meals.forEach(meal => {
      addMeal(meal);
      // addMeal()을 호출할때 random값을 지정해서 전달해주지 않으면 기본적으로 false를 전달해주도록 설계되어 있음.
      // false 로 전달받을 경우 <span class="random"> Random Recipe </span> 이 라벨을 붙여주는 HTMLString을 retrun하지는 않음.
    });
  }
});

popupCloseBtn.addEventListener('click', () => {
  mealPopup.classList.add('hidden');
});