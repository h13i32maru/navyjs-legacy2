#include "n_text_list_selector.h"

#include <window/n_list_dialog.h>

#include <n_project.h>

NTextListSelector::NTextListSelector(QWidget *parent) : QPushButton(parent) {
    mAllowEmpty = false;
    connect(this, SIGNAL(clicked()), this, SLOT(execListDialog()));

    this->setStyleSheet("QPushButton { text-align: left; }");
}

NTextListSelector::NTextListSelector(TYPE type, QWidget *parent) : NTextListSelector(parent) {
    mType = type;
}

void NTextListSelector::setType(TYPE type) {
    mType = type;
}

NTextListSelector::TYPE NTextListSelector::getType() {
    return mType;
}

void NTextListSelector::setAllowEmpty(bool allow) {
    mAllowEmpty = allow;
}

void NTextListSelector::setText(const QString &text) {
    QString oldText = this->text();
    QPushButton::setText(text);
    this->setToolTip(text);

    if (oldText != text) {
        emit this->textChanged(text);
    }
}

void NTextListSelector::execListDialog() {
    NListDialog dialog;

    QStringList list;
    switch(mType) {
    case LAYOUT:
        list = NProject::instance()->layouts();
        break;
    case PAGE:
        list = NProject::instance()->pages();
        break;
    case SCENE:
        list = NProject::instance()->scenes();
        break;
    case LINK:
        list = NProject::instance()->links();
        break;
    case IMAGE:
        list = NProject::instance()->images();
        break;
    case CODE:
        list = NProject::instance()->codes();
        break;
    }

    dialog.setTextList(list);
    dialog.setCurrentText(this->text());
    dialog.setAllowEmpty(mAllowEmpty);

    int exec = dialog.exec();
    if (exec == NListDialog::Accepted) {
        QString text = dialog.selectedText();
        this->setText(text);
    }

}
