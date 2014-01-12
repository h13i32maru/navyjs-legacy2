#include "n_text_list_selector.h"

#include <window/n_list_dialog.h>

#include <n_project.h>

NTextListSelector::NTextListSelector(TYPE type, QWidget *parent) : QPushButton(parent) {
    mType = type;
    connect(this, SIGNAL(clicked()), this, SLOT(execListDialog()));

    this->setFlat(true);
    this->setStyleSheet("QPushButton { \
                        background-color: qlineargradient(spread:pad, x1:0, y1:0, x2:0, y2:1, stop:0 rgba(230, 230, 230, 255), stop:1 rgba(200, 200, 200, 255)); \
                        border: 0px solid #aaaaaa; \
                        text-align: left;\
                      }");
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
    }

    dialog.setTextList(list);
    dialog.setCurrentText(this->text());

    int exec = dialog.exec();
    if (exec == NListDialog::Accepted) {
        QString text = dialog.selectedText();
        this->setText(text);
    }

}
