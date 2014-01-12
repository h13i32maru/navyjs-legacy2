#include "n_push_button.h"

#include <window/n_list_dialog.h>

#include <n_project.h>

NPushButton::NPushButton(TYPE type, QWidget *parent) : QPushButton(parent) {
    mType = type;
    connect(this, SIGNAL(clicked()), this, SLOT(execListDialog()));
}

void NPushButton::setText(const QString &text) {
    QString oldText = this->text();
    QPushButton::setText(text);

    if (oldText != text) {
        emit this->textChanged(text);
    }
}

void NPushButton::execListDialog() {
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
    }

    dialog.setTextList(list);
    dialog.setCurrentText(this->text());

    int exec = dialog.exec();
    if (exec == NListDialog::Accepted) {
        QString text = dialog.selectedText();
        this->setText(text);
    }

}
