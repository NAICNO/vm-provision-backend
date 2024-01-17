export class GenericResponse {
  static success() {
    return {message: 'success'}
  }

  static error() {
    return {message: 'error'}
  }
}


