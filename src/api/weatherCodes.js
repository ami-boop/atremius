export function weatherCodeToType(code) {
  if (code === 0) return "солнечно";
  if ([1].includes(code)) return "преимущественно ясно";
  if ([2].includes(code)) return "переменная облачность";
  if ([3].includes(code)) return "облачно";
  if ([45, 48].includes(code)) return "туман";
  if ([51, 53, 55, 56, 57].includes(code)) return "морось";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "дождь";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "снег";
  if ([95, 96, 99].includes(code)) return "гроза";
  return "облачно";
}

export function openWeatherToMeteoCode(openWeatherCode) {
  if (openWeatherCode === 800) return 0;
  if (openWeatherCode === 801) return 1;
  if (openWeatherCode === 802) return 2;
  if ([803, 804].includes(openWeatherCode)) return 3;

  if ([701, 711, 721, 731, 741, 751, 761, 762].includes(openWeatherCode)) return 45;

  if ([300, 301, 302, 310, 311, 312, 313, 314, 321].includes(openWeatherCode)) return 53;
  if ([500, 501].includes(openWeatherCode)) return 61;
  if ([502, 503].includes(openWeatherCode)) return 63;
  if ([504].includes(openWeatherCode)) return 65;
  if ([511].includes(openWeatherCode)) return 67;
  if ([520, 521].includes(openWeatherCode)) return 80;
  if ([522, 531].includes(openWeatherCode)) return 82;

  if ([600, 601].includes(openWeatherCode)) return 71;
  if ([602].includes(openWeatherCode)) return 75;
  if ([611, 612, 613].includes(openWeatherCode)) return 77;
  if ([615, 616].includes(openWeatherCode)) return 85;
  if ([620, 621].includes(openWeatherCode)) return 73;
  if ([622].includes(openWeatherCode)) return 86;

  if ([200, 201, 202, 210, 211, 212, 221, 230, 231, 232].includes(openWeatherCode)) return 95;

  return 3;
}
