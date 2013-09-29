#include "n_json.h"

#include <QFile>

NJson::NJson()
{
}

NJson::NJson(QJsonValue value)
{
    mRootValue = value;
}

NJson::NJson(const QString &jsonText) {
    parse(jsonText);
}

void NJson::parse(QByteArray byteArray)
{
    QJsonDocument doc = QJsonDocument::fromJson(byteArray);
    if (doc.isArray()) {
        mRootValue = QJsonValue(doc.array());
    } else {
        mRootValue = QJsonValue(doc.object());
    }
}

void NJson::parse(const QString &jsonText) {
    parse(jsonText.toUtf8());
}

bool NJson::parseFromFilePath(QString filePath)
{
    QFile file(filePath);
    if (!file.open(QIODevice::ReadOnly | QIODevice::Text)) {
        return false;
    }
    this->parse(file.readAll());
    file.close();
    return true;
}

QByteArray NJson::stringify()
{
    QJsonDocument doc;
    if (mRootValue.isArray()) {
        doc = QJsonDocument(mRootValue.toArray());
    } else {
        doc = QJsonDocument(mRootValue.toObject());
    }

    return doc.toJson();
}

int NJson::length()
{
    if (mRootValue.isArray()) {
        return mRootValue.toArray().size();
    } else {
        return 0;
    }
}

void NJson::clear() {
    if (mRootValue.isArray()) {
        mRootValue = QJsonValue(QJsonArray());
    } else {
        mRootValue = QJsonValue(QJsonObject());
    }
}

QVariant NJson::toVariant() {
    return mRootValue.toVariant();
}

int NJson::getInt(const QString &keysStr) const
{
    return (int) get(mRootValue, keysStr).toDouble();
}

QString NJson::getStr(const QString &keysStr) const
{
    return get(mRootValue, keysStr).toString();
}

NJson NJson::getObject(const QString &keysStr) const
{
    QJsonValue value = get(mRootValue, keysStr);
    return NJson(value);
}

QJsonValue NJson::get(const QJsonValue &value, const QString &keysStr) const
{
    QStringList keys = keysStr.split(".");
    QString key = keys[0];
    int index = key.toInt();
    QJsonValue nextValue;

    if (value.isArray()) {
        nextValue = value.toArray()[index];
    } else if (value.isObject()) {
        nextValue = value.toObject()[key];
    }

    if (keys.size() == 1) {
        return nextValue;
    } else {
        keys.pop_front();
        return get(nextValue, keys.join("."));
    }
}

void NJson::set(QString keysStr, int value)
{
    mRootValue = set(mRootValue, keysStr, QJsonValue(value));
}

void NJson::set(QString keysStr, QString value)
{
    mRootValue = set(mRootValue, keysStr, QJsonValue(value));
}

QJsonValue NJson::set(QJsonValue parentValue, QString keysStr, QJsonValue value)
{
    QStringList keys = keysStr.split(".");
    QString key = keys[0];
    int index = key.toInt();

    if (keys.size() == 1) {
        if (parentValue.isArray()) {
            QJsonArray array = parentValue.toArray();
            array[index] = value;
            return QJsonValue(array);
        } else {
            QJsonObject object = parentValue.toObject();
            object[key] = value;
            return QJsonValue(object);
        }
    } else {
        keys.pop_front();
        if (parentValue.isArray()) {
            QJsonArray array= parentValue.toArray();
            QJsonValue newValue = set(QJsonValue(array[index]), keys.join("."), value);
            if (array.size() <= index) {
                array.insert(index, newValue);
            } else {
                array[index] = newValue;
            }
            return QJsonValue(array);
        } else {
            QJsonObject object = parentValue.toObject();
            object[key] = set(QJsonValue(parentValue.toObject()[key]), keys.join("."), value);
            return QJsonValue(object);
        }
    }
}

void NJson::remove(const QString &keysStr) {
    mRootValue = remove(mRootValue, keysStr);
}

QJsonValue NJson::remove(QJsonValue parentValue, const QString &keysStr) {
    QStringList keys = keysStr.split(".");
    QString key = keys[0];
    int index = key.toInt();

    if (keys.size() == 1) {
        if (parentValue.isArray()) {
            QJsonArray array = parentValue.toArray();
            array.removeAt(index);
            return QJsonValue(array);
        } else {
            QJsonObject object = parentValue.toObject();
            object.remove(key);
            return QJsonValue(object);
        }
    } else {
        keys.pop_front();
        if (parentValue.isArray()) {
            QJsonArray array= parentValue.toArray();
            QJsonValue newValue = remove(QJsonValue(array[index]), keys.join("."));
            if (array.size() <= index) {
                array.insert(index, newValue);
            } else {
                array[index] = newValue;
            }
            return QJsonValue(array);
        } else {
            QJsonObject object = parentValue.toObject();
            object[key] = remove(QJsonValue(parentValue.toObject()[key]), keys.join("."));
            return QJsonValue(object);
        }
    }
}