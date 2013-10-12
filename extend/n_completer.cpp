#include "n_completer.h"

NCompleter::NCompleter(const QStringList &list, QObject *parent) : QCompleter(parent) {
    mList = list;
    mModel = new QStringListModel();
    mModel->setStringList(list);

    setModel(mModel);
    setCompletionMode(QCompleter::UnfilteredPopupCompletion);
    setModelSorting(QCompleter::CaseInsensitivelySortedModel);
    setCaseSensitivity(Qt::CaseInsensitive);
}

void NCompleter::setStringList(const QStringList &list) {
    mList = list;
    mModel->setStringList(list);
}

void NCompleter::update(const QString &word) {
    if (mList.indexOf(word) == -1) {
        QStringList filtered = mList.filter(word, caseSensitivity());
        mModel->setStringList(filtered);
    }
}
