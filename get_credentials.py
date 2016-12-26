from app import app
import pyaes

uri = raw_input("Enter database URI: ")
aes = pyaes.AESModeOfOperationCTR(app.config['SECRET_KEY'])
print aes.encrypt(uri).encode('base64', 'strict')

