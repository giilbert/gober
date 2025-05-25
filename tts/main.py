from flask import Flask, make_response, request
import flask_cors
import gtts
from io import BytesIO

app = Flask(__name__)

flask_cors.CORS(app, resources={r"/*": {"origins": "*"}})


@app.route("/")
def index():
    response = make_response()
    response.headers["Content-Type"] = "text/plain"
    response.data = "Hello, World!"
    return response


@app.route("/speak", methods=["POST"])
def speak():
    body = request.get_json()
    message = body["message"]

    tts = gtts.gTTS(message, lang="en")
    bytes = BytesIO()
    tts.write_to_fp(bytes)

    response = make_response()
    response.headers["Content-Type"] = "audio/mpeg"
    response.headers["Content-Disposition"] = "attachment; filename=output.mp3"
    response.data = bytes.getvalue()

    return response


if __name__ == "__main__":
    app.run()
