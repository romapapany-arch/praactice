          const countryInput = document.getElementById("country-input")
          const searchBox = document.getElementById("search-box")
          const countryDetailsElem = document.getElementById("country-details")
          const countryName = document.getElementById("country-name")
          const capitalTxt = document.getElementById("capital-city")
          const areaTxt = document.getElementById("area")
          const populationTxt = document.getElementById("population")
          const densityTxt = document.getElementById("pop-density")
          const currencyTxt = document.getElementById("currency")
          const languagesTxt = document.getElementById("languages")
          const continentTxt = document.getElementById("continent")
          const flagImg = document.getElementById("flag")
          const errTxt = document.getElementById("errorTxt")
          async function getCountry(countryName){
               const res = await fetch(`https://restcountries.com/v3.1/name/${countryName}`)
               const data = await res.json()
               return data.find(val=>val.name.common===countryName) || data[0]
          }
          searchBox.addEventListener("submit",async e=>{
               e.preventDefault()
               if(countryInput.value.trim()===""){
                    errTxt.textContent = "It is Required To Enter a Country Name To Search"
               } else {
                    errTxt.textContent = ""
                    try{
                         const country = await getCountry(countryInput.value);
                         const {name, capital, area, population, currencies, languages, continents, flags} = country
                         const currency = Object.values(currencies)[0]
                         countryName.textContent = name.common
                         capitalTxt.textContent = capital.join(", ")
                         areaTxt.textContent = area
                         populationTxt.textContent = population
                         densityTxt.textContent = (population/area).toFixed(2)
                         currencyTxt.textContent = `${currency.name} (${currency.symbol})`
                         languagesTxt.textContent = Object.values(languages).join(", ")
                         continentTxt.textContent = continents.join(", ")
                         flagImg.src = flags.svg
                         if(!countryDetailsElem.classList.contains("active"))
                              countryDetailsElem.classList.add("active")
                    } catch{
                         errTxt.textContent = "Country Not Found"
                    }
               }
          })