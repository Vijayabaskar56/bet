import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sort'
})
export class SortPipe implements PipeTransform {

  transform(array: any[], field: string): any[] {
    if (!Array.isArray(array)) {
      return array;
    }
    // Create a new array instance to avoid mutating the original array
    return array.slice().sort((a, b) => {
      if (a[field] < b[field]) { return -1; }
      if (a[field] > b[field]) { return 1; }
      return 0;
    });
  }

}
