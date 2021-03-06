#ifndef N_TEXT_LIST_SELECTOR_H
#define N_TEXT_LIST_SELECTOR_H

#include <QPushButton>

class NTextListSelector : public QPushButton
{
    Q_OBJECT
public:
    enum TYPE{LAYOUT,PAGE,SCENE,LINK,IMAGE,CODE};
    explicit NTextListSelector(QWidget *parent = 0);
    explicit NTextListSelector(TYPE type, QWidget *parent = 0);
    void setText(const QString &text);
    void setType(TYPE type);
    TYPE getType();
    void setAllowEmpty(bool allow);

private:
    TYPE mType;
    bool mAllowEmpty;

signals:
    void textChanged(const QString &text);

public slots:
    void execListDialog();

};

#endif // N_TEXT_LIST_SELECTOR_H
