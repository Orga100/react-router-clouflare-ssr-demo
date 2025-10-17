import * as Select from "@radix-ui/react-select";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import styles from "./city-selector.module.css";

interface City {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  population: number;
}

interface CitySelectorProps {
  value: string;
  onValueChange: (city: string) => void;
  cities: City[];
}

export function CitySelector({
  value,
  onValueChange,
  cities,
}: CitySelectorProps) {
  const displayValue = value
    ? `${value.split(",")[0]}, ${value.split(",")[1]}`
    : "";

  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger className={styles.trigger}>
        <Select.Value asChild>
          <span className={styles.value}>
            {displayValue || "Select city..."}
          </span>
        </Select.Value>
        <Select.Icon className={styles.icon}>
          <ChevronDownIcon />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content className={styles.content} position="popper">
          <Select.Viewport className={styles.viewport}>
            {cities.map((city) => (
              <Select.Item
                key={`${city.name}-${city.country}`}
                value={`${city.name},${city.country}`}
                className={styles.item}
              >
                <Select.ItemText>
                  {city.name}, {city.country}
                </Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
